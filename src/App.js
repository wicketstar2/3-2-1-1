import React, { Component, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, remove, set, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import './App.css';
import monstersData from './Book1.json';
import { ReactComponent as Loading } from './Gear@1x-0.1s-200px-200px.svg';




// Firebase configuration
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

// Modern Login Component
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (email === '123@123.com' && password === '123') {
        onLogin();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Redesigned Admin Panel
function AdminPanel({ onAddPlayer, onToggleSubmission }) {
  const [entries, setEntries] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState('closed');
  const [topThree, setTopThree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const submissionsRef = ref(db, 'submissions');
    const statusRef = ref(db, 'submissionStatus');

    const submissionsUnsubscribe = onValue(submissionsRef, (snapshot) => {
      setLoading(true);
      const data = snapshot.val();
      const values = data ? Object.values(data) : [];
      setEntries(values);

      // Calculate points
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
      setLoading(false);
    });

    const statusUnsubscribe = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      setSubmissionStatus(status || 'closed');
    });

    return () => {
      submissionsUnsubscribe();
      statusUnsubscribe();
    };
  }, []);

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all voting data? This action cannot be undone.')) {
      remove(ref(db, 'submissions'))
        .then(() => {
          // Clear both selectedPlayers and votedUsers databases
          remove(ref(db, 'selectedPlayers'))
            .then(() => {
              remove(ref(db, 'votedUsers'))
                .then(() => {
                  setEntries([]);
                  setTopThree([]);
                  alert('All data cleared successfully!');
                })
                .catch((error) => {
                  console.error('Error clearing voted users data: ', error);
                });
            })
            .catch((error) => {
              console.error('Error clearing selected players data: ', error);
            });
        })
        .catch((error) => {
          console.error('Error clearing data: ', error);
          alert('Error clearing data');
        });
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <p className="status-indicator">
          Current Status:
          <span className={`status-badge ${submissionStatus === 'open' ? 'status-open' : 'status-closed'}`}>
            {submissionStatus === 'open' ? 'Open' : 'Closed'}
          </span>
        </p>
      </div>

      <div className="action-buttons">
        <button
          className="action-button open-button"
          onClick={() => onToggleSubmission('open')}
          disabled={submissionStatus === 'open'}
        >
          Open Voting
        </button>
        <button
          className="action-button close-button"
          onClick={() => onToggleSubmission('closed')}
          disabled={submissionStatus === 'closed'}
        >
          Close Voting
        </button>
        <button
          className="action-button clear-button"
          onClick={handleClearData}
        >
          Clear All Data
        </button>
        <button
          className="action-button add-player-button"
          onClick={onAddPlayer}
        >
          Add Player
        </button>
      </div>

      {loading ? (
        <div className="loading-indicator">Loading data...</div>
      ) : (
        <>
          {submissionStatus === 'closed' && topThree.length > 0 && (
            <div className="top-players-card">
              <h3>🏆 Top Voted Players This Week</h3>
              <div className="top-players-list">
                {topThree.map(([player, points], index) => (
                  <div key={index} className={`player-rank rank-${index + 1}`}>
                    <div className="medal">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                    </div>
                    <div className="player-name">{player}</div>
                    <div className="player-points">{points} points</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="data-table-container">
            <h3>All Votes</h3>
            {entries.length === 0 ? (
              <p className="no-data">No votes have been submitted yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>3 Points</th>
                    <th>2 Points</th>
                    <th>1 Point</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.d1}</td>
                      <td>{entry.d2}</td>
                      <td>{entry.d3}</td>
                      <td>{entry.timestamp && new Date(entry.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Add Player Form Component
function AddPlayerForm({ onNewPlayer, onCancel }) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onNewPlayer({ Niall: newPlayerName.trim() });
      setNewPlayerName('');
    }
  };

  return (
    <div className="add-player-form">
      <h3>Add New Player</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPlayerName">Player Name:</label>
          <input
            type="text"
            id="newPlayerName"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="action-button submit-button">Add Player</button>
          <button type="button" className="action-button back-button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// Main App Component
class App extends Component {
  constructor() {
    super();
    this.submissionCloseTimer = null;
    this.state = {
      players: [],
      selected: { d1: '', d2: '', d3: '' },
      currentStep: 'playerList', // playerList, selection, submitted, addPlayer
      isAdmin: false,
      showLogin: false,
      submissionStatus: 'closed',
      selectedPlayers: [], // Track which players have been selected by anyone
      votedUsers: [], // Track which users have already voted
      userMessage: '',
      loading: true,
      userId: '', // User ID based on browser fingerprint
      hiddenPlayers: [], // Array to store names of players whose buttons should be hidden
      lastClickedPlayer: null, // Store the name of the last clicked player
      isAddingPlayer: false,
    };
  }

  componentDidMount() {
    // Load player data
    this.setState({ players: monstersData });

    // Generate a simple user ID based on browser fingerprint
    const userId = this.generateUserId();
    this.setState({ userId });

    // Monitor submission status, selected players, and voted users
    const statusRef = ref(db, 'submissionStatus');
    const selectedPlayersRef = ref(db, 'selectedPlayers');
    const votedUsersRef = ref(db, 'votedUsers');

    onValue(statusRef, (snapshot) => {
      const status = snapshot.val() || 'closed';
      this.setState({ submissionStatus: status });

      if (status === 'open') {
        if (this.submissionCloseTimer) clearTimeout(this.submissionCloseTimer);
        this.submissionCloseTimer = setTimeout(this.autoCloseSubmissions, 30 * 60 * 1000);
      } else if (this.submissionCloseTimer) {
        clearTimeout(this.submissionCloseTimer);
        this.submissionCloseTimer = null;
      }
    });

    // Get initially selected players
    onValue(selectedPlayersRef, (snapshot) => {
      const selected = snapshot.val();
      this.setState({
        selectedPlayers: selected ? Object.values(selected) : []
      });
    });

    // Get list of users who have already voted
    onValue(votedUsersRef, (snapshot) => {
      const votedUsers = snapshot.val() ? Object.values(snapshot.val()) : [];
      this.setState({
        votedUsers,
        loading: false
      });

      // Check if current user has already voted
      if (votedUsers.includes(userId)) {
        this.setState({
          userMessage: 'You have already submitted your vote this week.',
          currentStep: 'playerList'
        });
      }
    });
  }

  componentWillUnmount() {
    if (this.submissionCloseTimer) {
      clearTimeout(this.submissionCloseTimer);
    }
  }

  // Generate a simple user ID based on browser properties
  generateUserId = () => {
    const nav = window.navigator;
    const screen = window.screen;
    let idString = '';

    idString += nav.userAgent.replace(/\D+/g, '');
    idString += screen.height || '';
    idString += screen.width || '';
    idString += screen.pixelDepth || '';

    return btoa(idString).slice(0, 10);
  };

  autoCloseSubmissions = () => {
    console.log("⏱️ 30 minutes have passed! Submissions will now be closed.");
    set(ref(db, 'submissionStatus'), 'closed')
      .then(() => {
        this.setState({ submissionStatus: 'closed' });
      })
      .catch((err) => {
        console.error("Failed to auto-close submissions:", err);
      });
  };

  handlePlayerSelect = (playerName) => {
    // Check if user has already voted
    if (this.state.votedUsers.includes(this.state.userId)) {
      this.setState({
        userMessage: 'You have already submitted your vote this week.',
        currentStep: 'playerList'
      });
      return;
    }

    this.setState({
      currentStep: 'selection',
      lastClickedPlayer: playerName // Store the name of the clicked player
    });
  };

  handleVoteSubmit = () => {
    const { selected, userId, selectedPlayers, lastClickedPlayer } = this.state;

    // Validate all selections are made
    if (!selected.d1 || !selected.d2 || !selected.d3) {
      this.setState({ userMessage: 'Please select all three options' });
      return;
    }

    // Check if user has already voted
    if (this.state.votedUsers.includes(userId)) {
      this.setState({
        userMessage: 'You have already submitted your vote this week.',
        currentStep: 'playerList'
      });
      return;
    }

    // Create submission
    const submission = {
      ...selected,
      name: userId.substring(0, 5), // Use part of userId as submitter name
      timestamp: new Date().toISOString()
    };

    // Submit vote, record user as having voted, and add players to selectedPlayers
    push(ref(db, 'submissions'), submission)
      .then(() => {
        // Add user to the votedUsers list in database
        push(ref(db, 'votedUsers'), userId);

        // Add each player to the selectedPlayers list in database
        const playersToAdd = [selected.d1, selected.d2, selected.d3];
        playersToAdd.forEach(player => {
          if (!selectedPlayers.includes(player)) {
            push(ref(db, 'selectedPlayers'), player);
          }
        });

        // Update local state
        this.setState({
          currentStep: 'submitted',
          selected: { d1: '', d2: '', d3: '' },
          votedUsers: [...this.state.votedUsers, userId],
          selectedPlayers: [...this.state.selectedPlayers, ...playersToAdd.filter(p => !selectedPlayers.includes(p))],
          userMessage: '',
          hiddenPlayers: lastClickedPlayer ? [...this.state.hiddenPlayers, lastClickedPlayer] : this.state.hiddenPlayers, // Hide only the clicked player
          lastClickedPlayer: null // Reset last clicked player
        });

        // Auto-reset after 3 seconds
        setTimeout(() => {
          this.setState({ currentStep: 'playerList' });
        }, 3000);
      })
      .catch(error => {
        console.error("Error submitting vote:", error);
        this.setState({ userMessage: "Failed to submit your vote. Please try again." });
      });
  };

  handleSelectChange = (dropdownId, value) => {
    this.setState(prevState => ({
      selected: { ...prevState.selected, [dropdownId]: value },
      userMessage: '' // Clear error message when selection changes
    }));
  };




renderPlayerDropdown = (id, points) => {
  const { players, selected } = this.state;

  // Filter out only currently selected values in this form
  const currentlySelected = Object.values(selected).filter(val => val && val !== selected[id]);

  return (
    <div className="dropdown-container">
      <label htmlFor={id} className="points-label">{points} Points</label>
      <select
        id={id}
        value={selected[id]}
        onChange={(e) => this.handleSelectChange(id, e.target.value)}
        className="player-dropdown"
      >
        <option value="">Select a Player</option>
        {players
          .filter(player => {
            // Only filter out players already selected in another dropdown in this form
            return !currentlySelected.includes(player.Niall);
          })
          .map((player, index) => (
            <option key={index} value={player.Niall}>
              {player.Niall}
            </option>
          ))}
      </select>
    </div>
  );
};

renderAvailablePlayers = () => {
  const { players, submissionStatus, userId, votedUsers, hiddenPlayers } = this.state;
  const userHasVoted = votedUsers.includes(userId);

  return (
    <div className="player-list-container">
      <h2>Select a Player to Vote For</h2>

      {submissionStatus === 'closed' && (
        <div className="status-message closed">
          ⚠️ Voting is currently closed
        </div>
      )}

      {submissionStatus === 'open' && userHasVoted && (
        <div className="status-message info">
          You have already submitted your vote this week.
        </div>
      )}

      <div className="players-grid">
        {players
          .filter(player => !hiddenPlayers.includes(player.Niall))
          .map((player, index) => (
            <button
              key={index}
              className="player-button"
              onClick={() => this.handlePlayerSelect(player.Niall)}
              disabled={submissionStatus === 'closed' || userHasVoted}
            >
              {player.Niall}
            </button>
          ))}
      </div>
    </div>
  );
};

handleAdminToggle = () => {
  this.setState({ showLogin: !this.state.showLogin, isAdmin: false });
};

handleAdminLogin = () => {
  this.setState({ isAdmin: true, showLogin: false, isAddingPlayer: false });
};

handleAddPlayerClick = () => {
  this.setState({ isAddingPlayer: true });
};

handleNewPlayerSubmit = (newPlayer) => {
  this.setState(prevState => ({
    players: [...prevState.players, newPlayer],
    isAddingPlayer: false,
  }));
  // Optionally, you can also push the new player to your Firebase database
  push(ref(db, 'players'), newPlayer)
    .catch(error => console.error("Error adding player to database:", error));
};

handleCancelAddPlayer = () => {
  this.setState({ isAddingPlayer: false });
};

handleToggleSubmission = (status) => {
  // If closing submissions, reset the hiddenPlayers
  if (status === 'closed') {
    this.setState({ hiddenPlayers: [] }, () => {
      this.toggleSubmissionInDatabase(status);
    });
  } else {
    this.toggleSubmissionInDatabase(status);
  }
};

toggleSubmissionInDatabase = (status) => {
  // If opening submissions, reset both databases
  if (status === 'open') {
    remove(ref(db, 'selectedPlayers'))
      .then(() => {
        remove(ref(db, 'votedUsers'))
          .then(() => {
            set(ref(db, 'submissionStatus'), status)
              .then(() => alert('Submissions opened successfully. All players are now available.'))
              .catch((err) => alert('Error updating submission status: ' + err.message));
          })
          .catch((err) => {
            console.error('Error resetting voted users: ', err);
            alert('Error resetting user voting status');
          });
      })
      .catch((err) => {
        console.error('Error resetting selected players: ', err);
        alert('Error resetting player selections');
      });
  } else {
    set(ref(db, 'submissionStatus'), status)
      .then(() => alert('Submissions closed successfully. Player list hidden.'))
      .catch((err) => alert('Error updating submission status: ' + err.message));
  }
};

render() {
  const { currentStep, isAdmin, showLogin, userMessage, loading, isAddingPlayer, submissionStatus } = this.state;

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p className='l1'>Loading application...</p><Loading className='l'></Loading>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="app-container admin-mode">
        {isAddingPlayer ? (
          <AddPlayerForm onNewPlayer={this.handleNewPlayerSubmit} onCancel={this.handleCancelAddPlayer} />
        ) : (
          <AdminPanel onAddPlayer={this.handleAddPlayerClick} onToggleSubmission={this.handleToggleSubmission} />
        )}
        <button
          className="back-button"
          onClick={() => this.setState({ isAdmin: false, isAddingPlayer: false })}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Player of the Week Voting</h1>
        <button
          className="admin-toggle-button"
          onClick={this.handleAdminToggle}
        >
          {showLogin ? 'Hide Admin' : 'Admin Access'}
        </button>
      </header>

      {showLogin && (
        <Login onLogin={this.handleAdminLogin} />
      )}

      <main className="app-content">
        {userMessage && (
          <div className="user-message">
            {userMessage}
          </div>
        )}

        {currentStep === 'playerList' && this.renderAvailablePlayers()}

        {currentStep === 'selection' && (
          <div className="voting-form">
            <h2>Cast Your Vote</h2>
            <p className="instructions">
              Select your top three players in order of preference:
            </p>

            <div className="dropdowns-container">
              {this.renderPlayerDropdown('d1', 3)}
              {this.renderPlayerDropdown('d2', 2)}
              {this.renderPlayerDropdown('d3', 1)}
            </div>

            <div className="form-actions">
              <button
                className="action-button back-button"
                onClick={() => this.setState({ currentStep: 'playerList', userMessage: '' })}
              >
                Back
              </button>
              <button
                className="action-button submit-button"
                onClick={this.handleVoteSubmit}
                disabled={!this.state.selected.d1 || !this.state.selected.d2 || !this.state.selected.d3 || submissionStatus === 'closed'}
              >
                Submit Vote
              </button>
            </div>
          </div>
        )}

        {currentStep === 'submitted' && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Thank You!</h2>
            <p>Your vote has been submitted successfully.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2025 Player Voting System</p>
      </footer>
    </div>
  );
}
}

export default App;