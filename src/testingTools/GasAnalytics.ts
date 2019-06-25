import {Eth} from 'web3x/eth'
import {Tx} from 'web3x/contract/tx'

interface IDirectory<T> {
    [key: string]: T
}

type IMeasurement = IDirectory<IDirectory<number[]>>

export class GasAnalytics {

    private measurements: IMeasurement = {}

    public constructor(private eth: Eth) {

    }

    public async recordTransaction(namespace: string, name: string, transactionHash: string): Promise<void> {
        const receipt = await this.eth.getTransactionReceipt(transactionHash)

        this.recordValue(namespace, name, receipt.gasUsed)
    }

    public async recordEstimation(namespace: string, name: string, transaction: Tx): Promise<void> {
        const gasEstimation = await transaction.estimateGas()

        this.recordValue(namespace, name, gasEstimation)
    }

    private recordValue(namespace: string, name: string, gasUsed: number) {
        this.measurements[namespace] = this.measurements[namespace] || {}
        this.measurements[namespace][name] = this.measurements[namespace][name] || []

        this.measurements[namespace][name].push(gasUsed)
    }

    public printMeasurements(): void {
        const lines: string[] = []

        Object.keys(this.measurements).forEach(namespace => {
            Object.keys(this.measurements[namespace]).forEach(name => {
                const records = this.measurements[namespace][name]
                const average = Math.floor(records.reduce((accumulator, item) => accumulator + item, 0) / records.length)
                const min = Math.floor(records.reduce((accumulator, item) => Math.min(item, accumulator), Number.MAX_VALUE))
                const max = Math.floor(records.reduce((accumulator, item) => Math.max(item, accumulator), 0))

                const line = [average, min, max]
                    .map(item => item.toString().padStart(10))
                    .concat([namespace, name])
                    .join(' | ')
                lines.push(line)
            })
        })

        const title = `${'average'.padStart(10)} | ${'min'.padStart(10)} | ${'max'.padStart(10)} | name | namespace`
        console.log('gas consumption measurements:')
        console.log(title)
        console.log('-'.repeat(title.length))
        lines.forEach(item => console.log(item))
    }
    /*
    private async measureValueTransfer() {

    }
    */
}