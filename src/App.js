import React, { Component, useEffect, useState } from 'react';
import './App.css';
import monstersData from './Book1.json';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, remove, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBIvqgkOnORK4jjr1s7-IUnjUUVIEIeQ44",
  authDomain: "project-3145442148108828130.firebaseapp.com",
  databaseURL: "https://project-3145442148108828130-default-rtdb.firebaseio.com",
  projectId: "project-3145442148108828130",
  storageBucket: "project-3145442148108828130.appspot.com",
  messagingSenderId: "240531983328",
  appId: "1:240531983328:web:65e0b89f4af86eb4ddf985",
  measurementId: "G-2YVNYQ4GF6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@admin.com' && password === 'admin123') {
      onLogin();
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then(() => onLogin())
        .catch((err) => alert('Login failed: ' + err.message));
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ margin: '20px 0' }}>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}

function AdminPanel() {
  const [entries, setEntries] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState('closed');

  useEffect(() => {
    const submissionsRef = ref(db, 'submissions');
    onValue(submissionsRef, (snapshot) => {
      const data = snapshot.val();
      setEntries(data ? Object.values(data) : []);
    });

    const statusRef = ref(db, 'submissionStatus');
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      setSubmissionStatus(status || 'closed');
    });
  }, []);

  const handleClearData = () => {
    remove(ref(db, 'submissions'))
      .then(() => {
        alert('All data cleared!');
        setEntries([]);
      })
      .catch((error) => {
        console.error('Error clearing data: ', error);
        alert('Error clearing data');
      });
  };

  const toggleSubmission = (status) => {
    set(ref(db, 'submissionStatus'), status)
      .then(() => alert(`Submissions ${status}`))
      .catch((err) => alert('Error updating submission status: ' + err.message));
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <h3>Admin Panel</h3>
      <button onClick={() => toggleSubmission('open')} style={{ margin: '10px', backgroundColor: 'green', color: 'white' }}>
        Open Submission
      </button>
      <button onClick={() => toggleSubmission('closed')} style={{ margin: '10px', backgroundColor: 'orange', color: 'white' }}>
        Close Submission
      </button>
      <button onClick={handleClearData} style={{ margin: '20px 0', padding: '10px', backgroundColor: 'red', color: 'white' }}>
        Clear All Data
      </button>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px', fontFamily: 'Arial, sans-serif' }}>
        <thead style={{ backgroundColor: '#f4f4f4' }}>
          <tr>
            <th style={thStyle}>Player</th>
            <th style={thStyle}>3 Points</th>
            <th style={thStyle}>2 Points</th>
            <th style={thStyle}>1 Point</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index} style={index % 2 === 0 ? rowStyleEven : rowStyleOdd}>
              <td style={tdStyle}>{entry.d1}</td>
              <td style={tdStyle}>{entry.d1}</td>
              <td style={tdStyle}>{entry.d2}</td>
              <td style={tdStyle}>{entry.d3}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: '12px',
  border: '1px solid #ccc',
  textAlign: 'left',
  fontWeight: 'bold'
};

const tdStyle = {
  padding: '10px',
  border: '1px solid #ddd',
};

const rowStyleEven = {
  backgroundColor: '#f9f9f9'
};

const rowStyleOdd = {
  backgroundColor: '#ffffff'
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      monsters: [],
      selected: { d1: '', d2: '', d3: '' },
      showText: true,
      showText1: false,
      buttont1: false,
      button2: true,
      button3: true,
      for: false,
      d1: false,
      buttont2: true,
      showLogin: false,
      loggedIn: false,
      close: false,
      open: false,
      bb:false,
    };
  }

  componentDidMount() {
    this.setState({ monsters: monstersData });

    const statusRef = ref(db, 'submissionStatus');
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      this.setState({
        open: status === 'open',
        close: status === 'closed'
      });
    });
  }

  handleToggle = () => {
    this.setState({ showText: false, showText1: true, buttont1: true, d1: true, bb:true,});
  };

  handleToggle11 = () => {
    this.setState({ bb:false,});
  };
  handleToggle1 = () => {
    const { selected } = this.state;
    const submission = {
      ...selected,
      name: selected.d1
    };

    push(ref(db, 'submissions'), submission).then(() => {
      this.setState({
        showText: false,
        showText1: false,
        buttont1: false,
        for: true,
        d1: false,
        selected: { d1: '', d2: '', d3: '' },
      });
    });
  };

  handleToggle3 = () => {
    this.setState({ showText: true, showText1: true, buttont1: false, for: true, d1: false });
  };

  handleSelectChange = (dropdownId, value) => {
    this.setState((prevState) => ({
      selected: { ...prevState.selected, [dropdownId]: value },
    }));
  };

  renderDropdown = (id, label) => {
    const selectedValues = Object.values(this.state.selected).filter(
      (val) => val && val !== this.state.selected[id]
    );

    return (
      <div className='d1'>
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          value={this.state.selected[id]}
          onChange={(e) => this.handleSelectChange(id, e.target.value)}
        >
          <option value=''>Select</option>
          {this.state.monsters
            .filter((monster) => !selectedValues.includes(monster.Niall))
            .map((monster, index) => (
              <option key={index} value={monster.Niall}>
                {monster.Niall}
              </option>
            ))}
        </select>
      </div>
    );
  };

  render() {
    return (
      <div className='App'>
        {!this.state.loggedIn && (
          <button id='bbb' className='bbb' onClick={() => this.setState({ showLogin: !this.state.showLogin })}>
            {this.state.showLogin ? 'Hide Login' : 'Show Admin Login'}
          </button>
        )}

        {this.state.showLogin && !this.state.loggedIn && (
          <Login onLogin={() => this.setState({ loggedIn: true, showLogin: false })} />
        )}

        {!this.state.loggedIn && this.state.d1 && (
          <div className='d' style={{ display: 'flex' }}>
            {this.renderDropdown('d1', '3')}
            {this.renderDropdown('d2', '2')}
            {this.renderDropdown('d3', '1')}
          </div>
        )}

        {!this.state.loggedIn && this.state.showText && (
          <div>
            {this.state.monsters.map((monster, index) => (
              <div key={index}>
                <button onClick={this.handleToggle} className='b1'>
                  {monster.Niall}
                </button>
              </div>
            ))}
          </div>
        )}

        {!this.state.loggedIn && this.state.buttont1 && this.state.open && (
          <div style={{ display: 'flex' }}>
            <button className='b1' onClick={this.handleToggle1}>Save</button>
          </div>
        )}

        {!this.state.loggedIn && this.state.buttont1 && this.state.close && (
          <p style={{ color: 'red' }}>Submissions are currently closed.</p>
        )}

        {this.state.bb && this.state.button3 && (
          <button id='bb' className='bb' onClick={this.handleToggle3}>Back</button>
        )}

        {this.state.loggedIn && (
          <>
            <h2>Admin Table</h2>
            <AdminPanel />
          </>
        )}
      </div>
    );
  }
}

export default App;
