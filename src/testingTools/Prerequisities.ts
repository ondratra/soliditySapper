import {ContractServant} from './ContractServant'
import {GasAnalytics} from './GasAnalytics'
import {Eth} from 'web3x/eth';

export interface IPrerequisities {
    eth: Eth
    servant: ContractServant
    libraries: {
        [key: string]: string
    }
    gasAnalytics: GasAnalytics
}
