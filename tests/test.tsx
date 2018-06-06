
import {h, render, Component} from 'preact';
import * as styles from './test.css';

class Main extends Component<{}, {}> {

    constructor(props: any) {
        super(props);
        this.state = {
        };
    }

    public render() {
        return <div>Test</div>;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    render(<Main />, document.body);
});

