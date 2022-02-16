import '../style.css';

// Create a state machine transition function either using:
// - a switch statement (or nested switch statements)
// - or an object (transition lookup table)

// Also, come up with a simple way to "interpret" it, and
// make it an object that you can `.send(...)` events to.


const machine = {
    initial: 'loading',
    states: {
        loading: {
            on: {
                LOADED: 'playing'
            }
        },
        playing: {
            on: {
                PAUSE: 'paused'
            }
        },
        paused: {
            on: {
                PLAY: 'playing'
            }
        }
    }
}

let activeState = {
    state: machine.initial,
    send: function(event) {
        transition(this, event)
    }
}



function transition(state = {
    state: machine.initial
}, event) {
    const machineState = machine.states[activeState.state];
    const nextState = machineState?.on?.[event?.event];
    if (nextState) {
        activeState = {
            ...activeState,
            state: nextState
        }
    }
    console.log(`STATE IS ${activeState.state}`);

}



window.activeState = activeState;