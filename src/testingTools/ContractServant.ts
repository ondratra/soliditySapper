import {Eth} from 'web3x/eth'
import {ContractAbi} from 'web3x/contract/abi/contract-abi'
import {Contract} from 'web3x/contract'
import {Address} from 'web3x/address'
//import {linkBytecode} from 'solc/linker'
const linkBytecode = require('solc/linker').linkBytecode

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface IEVM {
    bytecode: {
        object: string
        linkReferences: unknown
    }
}

export interface ICompiledContract {
    abi: ContractAbi
    evm: IEVM
}

export interface ICompiledContracts {
    contracts: {
        [contractFile: string]: {
            [contractName: string]: ICompiledContract
        }
    }
}

export interface ILibraries {
    [key: string]: string
}


const milisecondsInSecond = 1000

// TODO: better naming
export default class ContractServant {

    private static nameDelimeter = ':'

    public blockTime: number
    //public web3: Web3
    public eth: any
    public compiledContracts: ICompiledContracts


    public constructor(eth: Eth, compiledContracts: ICompiledContracts, blockTime: number) {
        this.eth = eth
        this.compiledContracts = compiledContracts
        this.blockTime = blockTime
    }

    private getCompiledContract(name: string): ICompiledContract {
        const parts = name.split(ContractServant.nameDelimeter)

        const contract = this.compiledContracts.contracts[parts[0]] && this.compiledContracts.contracts[parts[0]][parts[1]]
        if (!contract) {
            throw `Undefined contract '${parts[0]}${ContractServant.nameDelimeter}${parts[1]}'`
        }

        return this.compiledContracts.contracts[parts[0]][parts[1]]
    }

    public async createContract(contractName: string, contractAddress: Address = null): Promise<Contract> {
        const compiledContract = this.getCompiledContract(contractName)
        const contract = await this.createContractFromCompiled(compiledContract, contractAddress)

        return contract
    }

    private async createContractFromCompiled(compiledContract: ICompiledContract, address: Address = undefined): Promise<Contract> {
        let abi = compiledContract.abi
        let contract = new Contract(this.eth, abi, address || undefined)

        return contract
    }

    //private linkLibraries(evm: IEVM, libraries: ILibraries[]): string {
    //    return linkBytecode(evm.bytecode.object, libraries)
    //}

    private async deployContract(compiledContract: ICompiledContract, creatorAddress: Address, constructorValues: unknown[], transactionSettings: Object, libraries: ILibraries): Promise<string> {
        const settings = {
            gas: 3000000,
            ...transactionSettings,
            from: creatorAddress
        }

        const data = '0x' + linkBytecode(compiledContract.evm.bytecode.object, libraries)
        if (data.includes('_')) {
            throw 'Not all libraries provided'
        }

        const contract = new Contract(this.eth, compiledContract.abi, undefined, settings)
        const deployObject = await contract.deployBytecode(data, ...constructorValues)

        const deployResponse = await deployObject.send(settings)
        const transactionHash = await deployResponse.getTxHash()

        return transactionHash
    }

    public async easyDeploy(contractName: string, creatorAddress: Address, constructorParameters: unknown[] = [], libraries: ILibraries = {}): Promise<{address: string, transactionHash: string}> {
        let compiledContract = this.getCompiledContract(contractName)
        let contract = await this.createContractFromCompiled(compiledContract)

        let transactionHash = await this.deployContract(compiledContract, creatorAddress, constructorParameters, {}, libraries)

        const address = await this.waitForTransactionMining(transactionHash)

        return {address, transactionHash}
    }

    public async waitForTransactionMining(transactionHash: string) {
        while (true) {
            let receipt: any = await this.eth.getTransactionReceipt(transactionHash)
            if (receipt && receipt.contractAddress) {
                return receipt.contractAddress
            }

            let blockNumber = await this.eth.getBlockNumber()
            console.log('Waiting for a block with contract. Current block: ' + blockNumber)
            await sleep(this.blockTime * milisecondsInSecond)
        }
    }
}
