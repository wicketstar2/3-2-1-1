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
function AdminPanel({ onAddPlayer, onToggleSubmission, onShowOverallChampion }) {
  const [currentEntries, setCurrentEntries] = useState([]);
  const [previousEntries, setPreviousEntries] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState('closed');
  const [currentTopThree, setCurrentTopThree] = useState([]);
  const [previousTopThree, setPreviousTopThree] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPreviousData, setShowPreviousData] = useState(null); // null = none, date string = show that date

  useEffect(() => {
    const currentSubmissionsRef = ref(db, 'currentSubmissions');
    const previousSubmissionsRef = ref(db, 'previousSubmissions');
    const statusRef = ref(db, 'submissionStatus');

    const fetchCurrentData = (ref) => {
      onValue(ref, (snapshot) => {
        const data = snapshot.val();
        const values = data ? Object.values(data) : [];
        const pointsMap = {};
        values.forEach(entry => {
          if (entry.d1) pointsMap[entry.d1] = (pointsMap[entry.d1] || 0) + 3;
          if (entry.d2) pointsMap[entry.d2] = (pointsMap[entry.d2] || 0) + 2;
          if (entry.d3) pointsMap[entry.d3] = (pointsMap[entry.d3] || 0) + 1;
        });
        const sortedPlayers = Object.entries(pointsMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);

        if (ref.key === 'currentSubmissions') {
          setCurrentEntries(values);
          setCurrentTopThree(sortedPlayers);
        }
        setLoading(false);
      });
    };

    const fetchPreviousData = () => {
      onValue(previousSubmissionsRef, (snapshot) => {
        setPreviousEntries(snapshot.val() || {});
      });
    };

    fetchCurrentData(currentSubmissionsRef);
    fetchPreviousData();

    const statusUnsubscribe = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      setSubmissionStatus(status || 'closed');
    });

    return () => {
      statusUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (previousEntries && showPreviousData) {
      const selectedData = previousEntries[showPreviousData];
      if (selectedData) {
        const values = Object.values(selectedData);
        const pointsMap = {};
        values.forEach(entry => {
          if (entry.d1) pointsMap[entry.d1] = (pointsMap[entry.d1] || 0) + 3;
          if (entry.d2) pointsMap[entry.d2] = (pointsMap[entry.d2] || 0) + 2;
          if (entry.d3) pointsMap[entry.d3] = (pointsMap[entry.d3] || 0) + 1;
        });
        const sortedPlayers = Object.entries(pointsMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        setPreviousTopThree({ [showPreviousData]: sortedPlayers });
      } else {
        setPreviousTopThree({});
      }
    }
  }, [previousEntries, showPreviousData]);

  const handleClearCurrentData = () => {
    if (window.confirm('Are you sure you want to clear all current voting data? This action cannot be undone.')) {
      remove(ref(db, 'currentSubmissions'))
        .then(() => {
          remove(ref(db, 'currentTopThree'))
            .then(() => {
              remove(ref(db, 'selectedPlayers'))
                .then(() => {
                  remove(ref(db, 'votedUsers'))
                    .then(() => {
                      setCurrentEntries([]);
                      setCurrentTopThree([]);
                      alert('Current voting data cleared successfully!');
                    })
                    .catch((error) => {
                      console.error('Error clearing voted users data: ', error);
                      alert('Error clearing voted users data');
                    });
                })
                .catch((error) => {
                  console.error('Error clearing selected players data: ', error);
                  alert('Error clearing selected players data');
                });
            })
            .catch((error) => {
              console.error('Error clearing current top three data: ', error);
              alert('Error clearing current top three data');
            });
        })
        .catch((error) => {
          console.error('Error clearing current data: ', error);
          alert('Error clearing current data');
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
          onClick={handleClearCurrentData}
        >
          Clear Current Data
        </button>
        <button
          className="action-button add-player-button"
          onClick={onAddPlayer}
        >
          Add Player
        </button>
        <button
          className="action-button champion-button"
          onClick={onShowOverallChampion}
        >
          Show Overall Champion
        </button>
        <select
          className="action-button select-previous-data"
          value={showPreviousData || ''}
          onChange={(e) => setShowPreviousData(e.target.value || null)}
        >
          <option value="">Show Current Data</option>
          {Object.keys(previousEntries)
            .sort((a, b) => new Date(b) - new Date(a))
            .map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </option>
            ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-indicator">Loading data...</div>
      ) : (
        <>
          {!showPreviousData && (
            <>
              {submissionStatus === 'closed' && currentTopThree.length > 0 && (
                <div className="top-players-card">
                  <h3>🏆 Top Voted Players This Week</h3>
                  <div className="top-players-list">
                    {currentTopThree.map(([player, points], index) => (
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
                <h3>Current Votes</h3>
                {currentEntries.length === 0 ? (
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
                      {currentEntries.map((entry, index) => (
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

          {showPreviousData && previousEntries[showPreviousData] && (
            <>
              {previousTopThree[showPreviousData] && previousTopThree[showPreviousData].length > 0 && (
                <div className="top-players-card">
                  <h3>🏆 Top Voted Players ({new Date(showPreviousData).toLocaleDateString()})</h3>
                  <div className="top-players-list">
                    {previousTopThree[showPreviousData].map(([player, points], index) => (
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
                <h3>Votes ({new Date(showPreviousData).toLocaleDateString()})</h3>
                {Object.keys(previousEntries[showPreviousData]).length === 0 ? (
                  <p className="no-data">No votes recorded for this date.</p>
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
                      {Object.values(previousEntries[showPreviousData]).map((entry, index) => (
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
        </>
      )}
    </div>
  );
}

// Overall Champion Display Component
function OverallChampion({ overallChampion, onClose }) {
  return (
    <div className="overall-champion-modal">
      <div className="champion-card">
        <h2>🏆 Overall Champion 🏆</h2>
        {overallChampion ? (
          <p className="champion-name">{overallChampion.player} with {overallChampion.totalPoints} total points!</p>
        ) : (
          <p>No overall champion data available yet.</p>
        )}
        <button className="action-button back-button" onClick={onClose}>Close</button>
      </div>
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
    this.dailyDataCheckInterval = null;
    this.state = {
      players: [],
      selected: { d1: '', d2: '', d3: '' },
      currentStep: 'playerList', // playerList, selection, submitted, addPlayer, overallChampion
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
      lastDataSnapshotDate: null,
      overallChampion: null,
      showOverallChampionModal: false,
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

    // Start interval to check for a new day
    this.dailyDataCheckInterval = setInterval(this.checkForNewDay,1 * 1000); // Check every 24 hours

    // Get the date of the last data snapshot
    get(ref(db, 'lastDataSnapshotDate'))
      .then(snapshot => {
        this.setState({ lastDataSnapshotDate: snapshot.val() });
      });

    // Fetch initial top three data (if any)
    onValue(ref(db, 'currentTopThree'), (snapshot) => {
      const topThree = snapshot.val() ? Object.values(snapshot.val()) : [];
      this.setState({ currentTopThree: topThree.map(item => [item.player, item.points]) });
    });

    // Fetch initial overall champion data (if any)
    onValue(ref(db, 'overallChampion'), (snapshot) => {
      this.setState({ overallChampion: snapshot.val() });
    });
  }

  componentWillUnmount() {
    if (this.submissionCloseTimer) {
      clearTimeout(this.submissionCloseTimer);
    }
    if (this.dailyDataCheckInterval) {
      clearInterval(this.dailyDataCheckInterval);
    }
  }

  checkForNewDay = () => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    if (this.state.lastDataSnapshotDate !== today) {
      console.log("📅 A new day has begun! Moving current data to previous...");
      this.moveCurrentDataToPrevious();
      set(ref(db, 'lastDataSnapshotDate'), today)
        .then(() => this.setState({ lastDataSnapshotDate: today }))
        .catch(error => console.error("Error updating last snapshot date:", error));
    }
  };

  moveCurrentDataToPrevious = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentSubmissionsRef = ref(db, 'currentSubmissions');
    const currentTopThreeRef = ref(db, 'currentTopThree');
    const previousSubmissionsRef = ref(db, `previousSubmissions/${today}`);

    // Move current submissions
    get(currentSubmissionsRef)
      .then(snapshot => {
        const currentData = snapshot.val();
        if (currentData) {
          return set(previousSubmissionsRef, currentData);
        }
        return null;
      })
      .then(() => remove(currentSubmissionsRef))
      .then(() => console.log(`✅ Current submissions moved to previous submissions for ${today}.`))
      .catch(error => console.error("Error moving current submissions:", error));

    // Move current top three
    get(currentTopThreeRef)
      .then(snapshot => {
        const currentTopThreeData = snapshot.val();
        if (currentTopThreeData) {
          return set(ref(db, `previousTopThree/${today}`), currentTopThreeData);
        }
        return null;
      })
      .then(() => remove(currentTopThreeRef))
      .then(() => console.log(`✅ Current top three moved to previous top three for ${today}.`))
      .catch(error => console.error("Error moving current top three:", error));

    // Clear current week's data
    remove(ref(db, 'selectedPlayers'))
      .then(() => console.log("✅ Selected players cleared."))
      .catch(error => console.error("Error clearing selected players:", error));
    remove(ref(db, 'votedUsers'))
      .then(() => {
        this.setState({ currentEntries: [], currentTopThree: [], selectedPlayers: [], votedUsers: [] });
        console.log("✅ Voted users cleared.");
      })
      .catch(error => console.error("Error clearing voted users:", error));
  };

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
    push(ref(db, 'currentSubmissions'), submission)
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

        // Calculate and update top three
        this.updateTopThree();

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

  updateTopThree = () => {
    const currentSubmissionsRef = ref(db, 'currentSubmissions');
    get(currentSubmissionsRef)
      .then(snapshot => {
        const data = snapshot.val();
        const values = data ? Object.values(data) : [];
        const pointsMap = {};
        values.forEach(entry => {
          if (entry.d1) pointsMap[entry.d1] = (pointsMap[entry.d1] || 0) + 3;
          if (entry.d2) pointsMap[entry.d2] = (pointsMap[entry.d2] || 0) + 2;
          if (entry.d3) pointsMap[entry.d3] = (pointsMap[entry.d3] || 0) + 1;
        });
        const sortedPlayers = Object.entries(pointsMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([player, points]) => ({ player, points })); // Format for storing in Firebase
        set(ref(db, 'currentTopThree'), sortedPlayers)
          .catch(error => console.error("Error updating top three:", error));
      })
      .catch(error => console.error("Error fetching current submissions for top three:", error));
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
    this.setState({ isAdmin: true, showLogin: false, isAddingPlayer: false, showOverallChampionModal: false });
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
    if (status === 'closed') {
      this.setState({ hiddenPlayers: [] }, () => {
        this.toggleSubmissionInDatabase(status);
      });
    } else {
      this.toggleSubmissionInDatabase(status);
    }
  };

  toggleSubmissionInDatabase = (status) => {
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

  handleShowOverallChampion = () => {
    const previousSubmissionsRef = ref(db, 'previousSubmissions');
    get(previousSubmissionsRef)
      .then(snapshot => {
        const allPreviousData = snapshot.val();
        if (allPreviousData) {
          const overallPoints = {};
          Object.values(allPreviousData).forEach(dailyData => {
            if (dailyData) {
              Object.values(dailyData).forEach(entry => {
                if (entry.d1) overallPoints[entry.d1] = (overallPoints[entry.d1] || 0) + 3;
                if (entry.d2) overallPoints[entry.d2] = (overallPoints[entry.d2] || 0) + 2;
                if (entry.d3) overallPoints[entry.d3] = (overallPoints[entry.d3] || 0) + 1;
              });
            }
          });
          const sortedOverall = Object.entries(overallPoints)
            .sort(([, a], [, b]) => b - a)
            .map(([player, totalPoints]) => ({ player, totalPoints }));

          if (sortedOverall.length > 0) {
            this.setState({ overallChampion: sortedOverall[0], showOverallChampionModal: true });
            set(ref(db, 'overallChampion'), sortedOverall[0]); // Optionally save the latest overall champion
          } else {
            this.setState({ overallChampion: null, showOverallChampionModal: true });
          }
        } else {
          this.setState({ overallChampion: null, showOverallChampionModal: true });
        }
      })
      .catch(error => {
        console.error("Error fetching previous submissions:", error);
        this.setState({ overallChampion: null, showOverallChampionModal: true });
      });
  };

  handleCloseOverallChampionModal = () => {
    this.setState({ showOverallChampionModal: false });
  };

  render() {
    const { currentStep, isAdmin, showLogin, userMessage, loading, isAddingPlayer, submissionStatus, showOverallChampionModal, overallChampion } = this.state
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
            <AdminPanel
              onAddPlayer={this.handleAddPlayerClick}
              onToggleSubmission={this.handleToggleSubmission}
              onShowOverallChampion={this.handleShowOverallChampion}
            />
          )}
          <button
            className="back-button"
            onClick={() => this.setState({ isAdmin: false, isAddingPlayer: false, showOverallChampionModal: false })}
          >
            Back to Home
          </button>

          {showOverallChampionModal && (
            <OverallChampion overallChampion={overallChampion} onClose={this.handleCloseOverallChampionModal} />
          )}
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