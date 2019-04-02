import {Eth} from 'web3x/eth'
import {LegacyProviderAdapter, HttpProvider} from 'web3x/providers'
import * as fs from 'fs'
import * as http from "http"
//import * as Ganache from 'ganache-core'

export const autominingBlockTime = 0.1;


export default async function ethereumSimulator(): Promise<Eth> {
    const Ganache = require('ganache-core');
    const legacyProvider = Ganache.provider({
        blocktime: autominingBlockTime, // turns on automining
        default_balance_ether: 100

    });

    //const provider = new HttpProvider('http://127.0.0.1:7545')
    const provider = new LegacyProviderAdapter(legacyProvider)
    const eth = new Eth(provider)

    return eth
}
