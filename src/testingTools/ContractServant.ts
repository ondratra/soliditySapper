import {Eth} from 'web3x/eth'
import {ContractAbi} from 'web3x/contract/abi/contract-abi'
import {ContractAbiDefinition} from 'web3x/contract/abi/contract-abi-definition'
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
    abi: ContractAbiDefinition
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
export class ContractServant {

    private static nameDelimeter = ':'

    public blockTime: number
    public eth: Eth
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
        const abiObject = new ContractAbi(compiledContract.abi)
        const contract = new Contract(this.eth, abiObject, address || undefined)

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

        const abiObject = new ContractAbi(compiledContract.abi)
        const contract = new Contract(this.eth, abiObject, undefined, settings)
        const deployObject = await contract.deployBytecode(data, ...constructorValues)

        const deployResponse = await deployObject.send(settings)
        const transactionHash = await deployResponse.getTxHash()

        return transactionHash
    }

    public async easyDeploy(contractName: string, creatorAddress: Address, constructorParameters: unknown[] = [], libraries: ILibraries = {}, transactionSettings: Object = {}): Promise<{address: Address, transactionHash: string}> {
        const compiledContract = this.getCompiledContract(contractName)
        const contract = await this.createContractFromCompiled(compiledContract)

        const transactionHash = await this.deployContract(compiledContract, creatorAddress, constructorParameters, transactionSettings, libraries)

        const address = await this.waitForTransactionMining(transactionHash)

        return {address, transactionHash}
    }

    public async waitForTransactionMining(transactionHash: string): Promise<Address> {
        while (true) {
            //const receipt: any = await this.eth.getTransactionReceipt(transactionHash)
            const receipt = await this.eth.getTransactionReceipt(transactionHash)
            if (receipt && receipt.contractAddress) {
                return receipt.contractAddress
            }

            const blockNumber = await this.eth.getBlockNumber()
            console.log('Waiting for a block with contract. Current block: ' + blockNumber)
            await sleep(this.blockTime * milisecondsInSecond)
        }
    }
}
