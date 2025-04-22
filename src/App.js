import React, { Component, useEffect, useState } from 'react';
import './App.css';
import monstersData from './Book1.json';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBIvqgkOnORK4jjr1s7-IUnjUUVIEIeQ44",
  authDomain: "project-3145442148108828130.firebaseapp.com",
  databaseURL: "https://project-3145442148108828130-default-rtdb.firebaseio.com",
  projectId: "project-3145442148108828130",
  storageBucket: "project-3145442148108828130.firebasestorage.app",
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

  useEffect(() => {
    const submissionsRef = ref(db, 'submissions');
    onValue(submissionsRef, (snapshot) => {
      const data = snapshot.val();
      setEntries(data ? Object.values(data) : []);
    });
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>1 point</th>
          <th>2 points</th>
          <th>3 points</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={index}>
            <td>{entry.d1}</td>
            <td>{entry.d2}</td>
            <td>{entry.d3}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      monsters: [],
      usedMonsters: [], // NEW
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
    };
  }

  componentDidMount() {
    this.setState({ monsters: monstersData });

    // 🔥 Load used names from Firebase
    const usedRef = ref(db, 'usedMonsters');
    onValue(usedRef, (snapshot) => {
      const data = snapshot.val();
      const used = data ? Object.values(data) : [];
      this.setState({ usedMonsters: used });
    });
  }

  handleToggle = () => {
    this.setState({ showText: false, showText1: true, buttont1: true, d1: true });
  };

  handleToggle1 = () => {
    const { selected } = this.state;
    push(ref(db, 'submissions'), selected).then(() => {
      // 🔥 Save used names
      Object.values(selected).forEach((name) => {
        if (name) {
          push(ref(db, 'usedMonsters'), name);
        }
      });

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

  handleToggle2 = () => {
    this.setState({ showText: true, showText1: true, buttont1: true, for: true });
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
            .filter(
              (monster) =>
                !selectedValues.includes(monster.Niall) &&
                !this.state.usedMonsters.includes(monster.Niall) // 👈 filter out used names
            )
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
          <button onClick={() => this.setState({ showLogin: !this.state.showLogin })}>
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
          <div style={{ display: 'flex' }}>
            {this.state.monsters.map((monster, index) => (
              <div key={index}>
                <button onClick={this.handleToggle} className='b1'>
                  {monster.Niall}
                </button>
              </div>
            ))}
          </div>
        )}

        {!this.state.loggedIn && this.state.buttont1 && (
          <div style={{ display: 'flex' }}>
            <button className='b1' onClick={this.handleToggle1}>Save</button>
          </div>
        )}

        {this.state.button3 &&
          <button onClick={this.handleToggle3}>Back</button>
        }

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
