import {Eth} from 'web3x/eth'

interface IDirectory<T> {
    [key: string]: T
}

type IMeasurement = IDirectory<IDirectory<number[]>>

export default class GasAnalytics {

    private measurements: IMeasurement = {}

    public constructor(private eth: Eth) {

    }

    public async recordTransaction(namespace: string, name: string, transactionHash: string) {
        const receipt = await this.eth.getTransactionReceipt(transactionHash)

        this.measurements[namespace] = this.measurements[namespace] || {}
        this.measurements[namespace][name] = this.measurements[namespace][name] || []

        this.measurements[namespace][name].push(receipt.gasUsed)
    }

    public printMeasurements() {
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