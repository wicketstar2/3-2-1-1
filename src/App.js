import React, { Component, useEffect, useState } from 'react';
import './App.css';
import monstersData from './Book1.json';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, remove, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import myImage from './Untitled.png';

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
    if (email === '123@123.com' && password === '123') {
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

function MyComponent() {
  return (
    <button
      style={{
        backgroundImage: `url(${myImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        width: '100px', 
        height: '100px',
        border: 'none',
        cursor: 'pointer',
      }}
      onClick={() => {
        alert('Button clicked!');
      }}
    >
    </button>
  );
}

function AdminPanel() {
  const [entries, setEntries] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState('closed');
  const [topThree, setTopThree] = useState([]);

  useEffect(() => {
    const submissionsRef = ref(db, 'submissions');
    onValue(submissionsRef, (snapshot) => {
      const data = snapshot.val();
      const values = data ? Object.values(data) : [];
      setEntries(values);

      const pointsMap = {};
      values.forEach(entry => {
        if (entry.d1) pointsMap[entry.d1] = (pointsMap[entry.d1] || 0) + 3;
        if (entry.d2) pointsMap[entry.d2] = (pointsMap[entry.d2] || 0) + 2;
        if (entry.d3) pointsMap[entry.d3] = (pointsMap[entry.d3] || 0) + 1;
      });

      const sortedPlayers = Object.entries(pointsMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      setTopThree(sortedPlayers);
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
        setTopThree([]);
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
      <h3 style={{ fontSize: '20px' }}>Admin Panel</h3>
      <button id='b1' className='b1' onClick={() => toggleSubmission('open')} style={{ fontSize: '15px', margin: '20px 0', padding: '10pxpx', backgroundColor: 'green', color: 'white' }}>
        Open Submission
      </button>
      <button className='b1' onClick={() => toggleSubmission('closed')} style={{ fontSize: '15px', margin: '10px', backgroundColor: 'orange', color: 'white' }}>
        Close Submission
      </button>
      <button className='b1' onClick={handleClearData} style={{ fontSize: '15px', margin: '20px 0', padding: '10px', backgroundColor: 'red', color: 'white' }}>
        Clear All Data
      </button>

      {submissionStatus === 'closed' && topThree.length > 0 && (
        <div style={{ margin: '20px 0', fontWeight: 'bold' }}>
          <p>🏆 Top Voted Players For This Week:</p>
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
  {topThree.map(([player, points], index) => (
    <li key={index}>
      {index === 0 && '🥇 '}
      {index === 1 && '🥈 '}
      {index === 2 && '🥉 '}
      {player} - {points} points
    </li>
  ))}
</ul>

        </div>
      )}

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

// ... rest of the App component remains unchanged


class App extends Component {
  constructor() {
    super();
    this.submissionCloseTimer = null;
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
      bb: false,
      bc: true,
      MyComponent: true,
    };
  }

  componentDidMount() {
    this.setState({ monsters: monstersData });

    const statusRef = ref(db, 'submissionStatus');
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      const isOpen = status === 'open';
      const isClosed = status === 'closed';

      this.setState({
        open: isOpen,
        close: isClosed
      });

      if (isOpen) {
        if (this.submissionCloseTimer) clearTimeout(this.submissionCloseTimer);
        this.submissionCloseTimer = setTimeout(this.runAfterThirtyMinutes, 30 *60* 1000);
      } else {
        if (this.submissionCloseTimer) {
          clearTimeout(this.submissionCloseTimer);
          this.submissionCloseTimer = null;
        }
      }
    });
  }

  componentWillUnmount() {
    if (this.submissionCloseTimer) {
      clearTimeout(this.submissionCloseTimer);
    }
  }

  runAfterThirtyMinutes = () => {
    console.log("⏱️ 30 minutes have passed! Submissions will now be closed.");
    set(ref(db, 'submissionStatus'), 'closed')
      .then(() => {
        this.setState({ open: false, close: true });
      })
      .catch((err) => {
        console.error("Failed to auto-close submissions:", err);
      });
  };

  // ... rest of your methods (handleToggle, handleToggle11, handleToggle1, etc.)


  handleToggle = () => {
    this.setState({ showText: false, showText1: true, buttont1: true, d1: true, bb: true, button3: true });
  };

  handleToggle11 = () => {
    this.setState({ bb: false });
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
    this.setState({ showText: true, showText1: true, buttont1: false, for: true, d1: false, bb: false, button3: false });
  };

  handleToggle4 = () => {
    this.setState({ bc: true });
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
          <div className='d'>
            {this.renderDropdown('d1', '3')}
            {this.renderDropdown('d2', '2')}
            {this.renderDropdown('d3', '1')}
          </div>
        )}

        {!this.state.loggedIn && this.state.showText && (
          <div style={{ display: '' }}>
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
            <h2></h2>
            <AdminPanel />

            {/* Back to Home Button */}
            <button
              className='b1'
              style={{ position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                padding: '10px',
                zIndex: 1000, marginTop: '20px', backgroundColor: '#007bff', color: 'white', padding: '10px' }}
              onClick={() => this.setState({ loggedIn: false })}
            >
              Back to Home
            </button>
          </>

          
        )}
    <div className="App">
  <div style={{
    maxHeight: '90vh',
    width: '100%',
    overflowY: 'auto',
    padding: '10px',
    boxSizing: 'border-box',
  }}>
    {/* Your components here */}
  </div>
</div>

      </div>
    );
  }
}


export default App;
