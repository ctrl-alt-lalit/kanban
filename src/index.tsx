import React from 'react';
import ReactDOM from 'react-dom';


function App(): JSX.Element {
    return (
        <div>
            <h1> This is react </h1>
        </div>
    );
}

console.log('script loaded');
ReactDOM.render(<App/>, document.getElementById('root'));