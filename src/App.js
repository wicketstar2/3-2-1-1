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
function Login({ onLogin, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (email === '3-2-1@nuvu.au' && password === '!#Admin#!') {
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
        <button type="button" className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// Redesigned Admin Panel
function AdminPanel({ onAddPlayer, onToggleSubmission, onShowOverallChampion, onEditPlayers }) {
  const [currentEntries, setCurrentEntries] = useState([]);
  const [previousEntries, setPreviousEntries] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState('closed');
  const [currentTopThree, setCurrentTopThree] = useState([]);
  const [previousTopThree, setPreviousTopThree] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPreviousData, setShowPreviousData] = useState(null); // null = none, date string = show that date
  const [archives, setArchives] = useState({});
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archivesList, setArchivesList] = useState([]);

  useEffect(() => {
    const currentSubmissionsRef = ref(db, 'currentSubmissions');
    const previousSubmissionsRef = ref(db, 'previousSubmissions');
    const statusRef = ref(db, 'submissionStatus');
    const archivesRef = ref(db, 'archives');

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
// Check 
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

    onValue(archivesRef, (snapshot) => {
      setArchives(snapshot.val() || {});
    });

    // Add archives listener
    onValue(archivesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const archives = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value
      })).sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
      setArchives(data);
      setArchivesList(archives);
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
{/* Show Current data */}
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
        <button
          className="action-button edit-players-button"
          onClick={onEditPlayers}
        >
          Edit Players
        </button>
        
        <select
          className="action-button select-previous-data"
          value={selectedArchive || ''}
          onChange={(e) => setSelectedArchive(e.target.value)}
        >
          <option value="">Current Data</option>
          {Object.keys(archives)
            .sort((a, b) => new Date(b) - new Date(a))
            .map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </option>
            ))}
        </select>

        <button
          className="action-button danger-button"
          onClick={() => {
            if (window.confirm('⚠️ WARNING: This will permanently delete ALL data including current votes, archives, and rankings. This action cannot be undone.')) {
              if (window.prompt('Type "DELETE " to confirm:') === 'DELETE') {
                Promise.all([
                  remove(ref(db, 'currentSubmissions')),
                  remove(ref(db, 'currentTopThree')),
                  remove(ref(db, 'previousSubmissions')),
                  remove(ref(db, 'previousTopThree')),
                  remove(ref(db, 'archives')),
                  remove(ref(db, 'archivesList')),
                  remove(ref(db, 'selectedPlayers')),
                  remove(ref(db, 'votedUsers')),
                  remove(ref(db, 'overallRankings')),
                ]).then(() => {
                  alert('✅ All data has been successfully cleared.');
                }).catch(error => {
                  console.error('Error clearing data:', error);
                  alert('❌ Error clearing data. Please try again.');
                });
              }
            }
          }}
        >
          Clear All Data
        </button>
       
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

          {selectedArchive && archives[selectedArchive] && (
            <div className="archived-data">
              <h3>Archived Data - {new Date(selectedArchive).toLocaleDateString()}</h3>
              
              {archives[selectedArchive].topThree && (
                <div className="top-players-card">
                  <h4>Top Players</h4>
                  <div className="top-players-list">
                    {archives[selectedArchive].topThree.map((player, index) => (
                      <div key={index} className={`player-rank rank-${index + 1}`}>
                        <div className="medal">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                        </div>
                        <div className="player-name">{player.player}</div>
                        <div className="player-points">{player.points} points</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {archives[selectedArchive].submissions && (
                <div className="data-table-container">
                  <h4>Submissions</h4>
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
                      {Object.values(archives[selectedArchive].submissions).map((entry, index) => (
                        <tr key={index}>
                          <td>{entry.d1}</td>
                          <td>{entry.d2}</td>
                          <td>{entry.d3}</td>
                          <td>{entry.timestamp && new Date(entry.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
<button></button>
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
        <button  className="close" onClick={onClose}>Close</button>
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
      onNewPlayer({ PlayerName: newPlayerName.trim() }); // Changed from Niall to PlayerName
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

// Edit Players Component
function EditPlayers({ players, onEditName, onRemove, onBack }) {
  return (
    <div className="edit-players-container">
      <h2>Edit Players</h2>
      <div className="players-list">
        {players.map((player) => (
          <div key={player.key || player.PlayerName} className="edit-player-item">
            <input
              type="text"
              defaultValue={player.PlayerName} // Changed from Niall to PlayerName
              disabled={!player.isCustom}
              onBlur={(e) => player.isCustom && onEditName(player.key || player.PlayerName, e.target.value)}
              className={`edit-player-input ${!player.isCustom ? 'readonly' : ''}`}
            />
            {player.isCustom && (
              <button 
                className="remove-player-button"
                onClick={() => onRemove(player.key || player.PlayerName)}
              >
                Remove
              </button>
            )}
            {!player.isCustom && (
              <span className="default-player-badge">Default Player Can Not Be removed</span>
            )}
          </div>
        ))}
      </div>
      <button className="action-button back-button" onClick={onBack}>Back</button>
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
      selected: { d1: '', d2: '' , d3: '' },
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
      isEditingPlayers: false,
    };
  }

  handleEditPlayersClick = () => {
    this.setState({ isEditingPlayers: true });
  };

  handleEditPlayerName = async (playerKey, newName) => {
    try {
      // First find the player in Firebase
      const playersRef = ref(db, 'players');
      const snapshot = await get(playersRef);
      const players = snapshot.val();
      
      // Find the correct key if we're using the name as key
      const actualKey = Object.keys(players || {}).find(
        key => players[key].Niall === playerKey
      ) || playerKey;

      // Get the current player data to preserve isCustom flag
      const currentPlayer = players[actualKey];
      
      // Update the player while preserving isCustom and addedAt
      const playerRef = ref(db, `players/${actualKey}`);
      await set(playerRef, {
        Niall: newName,
        isCustom: currentPlayer.isCustom || false,
        addedAt: currentPlayer.addedAt || new Date().toISOString()
      });
      
      alert('Player name updated successfully');
    } catch (error) {
      console.error("Error updating player:", error);
      alert("Failed to update player");
    }
  };

  handleRemovePlayer = async (playerKey) => {
    if (window.confirm('Are you sure you want to remove this player?')) {
      try {
        // First find the player in Firebase
        const playersRef = ref(db, 'players');
        const snapshot = await get(playersRef);
        const players = snapshot.val();
        
        // Find the correct key if we're using the name as key
        const actualKey = Object.keys(players || {}).find(
          key => players[key.Niall === playerKey]
        ) || playerKey;

        // Remove the player
        const playerRef = ref(db, `players/${actualKey}`);
        await remove(playerRef);
        alert('Player removed successfully');
      } catch (error) {
        console.error("Error removing player:", error);
        alert("Failed to remove player");
      }
    }
  };

  componentDidMount() {
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

    onValue(selectedPlayersRef, (snapshot) => {
      const selected = snapshot.val();
      this.setState({
        selectedPlayers: selected ? Object.values(selected) : []
      });
    });

    onValue(votedUsersRef, (snapshot) => {
      const votedUsers = snapshot.val() ? Object.values(snapshot.val()) : [];
      this.setState({
        votedUsers,
        loading: false
      });

      if (votedUsers.includes(userId)) {
        this.setState({
          userMessage: 'You have already submitted your vote this week.',
          currentStep: 'playerList'
        });
      }
    });

    // Listen for real-time updates to the players list
    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => {
      const playersData = snapshot.val();
      const firebasePlayers = playersData ? 
        Object.entries(playersData).map(([key, value]) => ({
          ...value,
          key // Add the Firebase key to each player
        })) : [];

      // Merge imported players with Firebase players, avoiding duplicates
      const mergedPlayers = [...firebasePlayers];
      monstersData.forEach((importedPlayer) => {
        if (!mergedPlayers.some(player => player.PlayerName === importedPlayer.PlayerName)) { // Changed from Niall to PlayerName
          mergedPlayers.push({
            ...importedPlayer,
            isCustom: false // Mark imported players as non-custom
          });
        }
      });

      this.setState({ players: mergedPlayers });
    });

    // Add archive checker
    this.archiveCheckInterval = setInterval(this.checkAndArchiveData, 60 * 60 * 1000); // Check every hour

    // Monitor submission status
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val() || 'closed';
      this.setState({ submissionStatus: status });

      if (status === 'closed') {
        // Start checking for archive after closing
        this.checkAndArchiveData();
      }
    });
  }

  componentWillUnmount() {
    if (this.submissionCloseTimer) {
      clearTimeout(this.submissionCloseTimer);
    }
    if (this.dailyDataCheckInterval) {
      clearInterval(this.dailyDataCheckInterval);
    }
    if (this.archiveCheckInterval) {
      clearInterval(this.archiveCheckInterval);
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
              return !currentlySelected.includes(player.PlayerName); // Changed from Niall to PlayerName
            })
            .map((player, index) => (
              <option key={index} value={player.PlayerName}> {/* Changed from Niall to PlayerName */}
                {player.PlayerName} {/* Changed from Niall to PlayerName */}
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
        {/* ...status messages remain the same */}
        <div className="players-grid">
          {players
            .filter(player => !hiddenPlayers.includes(player.PlayerName)) // Changed from Niall to PlayerName
            .map((player, index) => (
              <button
                key={index}
                className="player-button"
                onClick={() => this.handlePlayerSelect(player.PlayerName)} // Changed from Niall to PlayerName
                disabled={submissionStatus === 'closed' || userHasVoted}
              >
                {player.PlayerName} {/* Changed from Niall to PlayerName */}
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
    const playersRef = ref(db, 'players');
    // Add isCustom flag to identify manually added players
    const playerWithMetadata = {
      ...newPlayer,
      isCustom: true,
      addedAt: new Date().toISOString()
    };
    
    push(playersRef, playerWithMetadata)
      .then(() => {
        this.setState({ isAddingPlayer: false });
      })
      .catch((error) => {
        console.error("Error adding player to database:", error);
        alert("Failed to add player. Please try again.");
      });
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
    if (status === 'closed') {
      // Archive current data before closing
      Promise.all([
        get(ref(db, 'currentSubmissions')),
        get(ref(db, 'currentTopThree'))
      ]).then(([submissionsSnapshot, topThreeSnapshot]) => {
        const currentTime = new Date();
        const archiveId = `${currentTime.toISOString().split('.')[0]}`;
        const archiveData = {
          submissions: submissionsSnapshot.val(),
          topThree: topThreeSnapshot.val(),
          archivedAt: currentTime.toISOString(),
          closedAt: currentTime.toISOString(),
          date: currentTime.toLocaleDateString(),
          displayName: `Voting closed on ${currentTime.toLocaleDateString()} at ${currentTime.toLocaleTimeString()}`
        };

        // Save to archives
        Promise.all([
          set(ref(db, `archives/${archiveId}`), archiveData),
          set(ref(db, 'submissionStatus'), status),
          remove(ref(db, 'currentSubmissions')),
          remove(ref(db, 'currentTopThree')),
          remove(ref(db, 'selectedPlayers')),
          remove(ref(db, 'votedUsers'))
        ]).then(() => {
          alert('Submissions closed and archived successfully.');
        }).catch(err => alert('Error closing submissions: ' + err.message));
      });
    } else {
      // Opening voting
      Promise.all([
        remove(ref(db, 'selectedPlayers')),
        remove(ref(db, 'votedUsers')),
        set(ref(db, 'submissionStatus'), status)
      ]).then(() => {
        alert('Submissions opened successfully. All players are now available.');
      }).catch(err => alert('Error updating submission status: ' + err.message));
    }
  };

  handleShowOverallChampion = () => {
    Promise.all([
      get(ref(db, 'previousSubmissions')),
      get(ref(db, 'archives')),
      get(ref(db, 'currentSubmissions'))
    ]).then(([previousSnapshot, archivesSnapshot, currentSnapshot]) => {
      const overallPoints = {};

      // Calculate points from previous submissions
      const previousData = previousSnapshot.val() || {};
      Object.values(previousData).forEach(dailyData => {
        Object.values(dailyData).forEach(entry => {
          if (entry.d1) overallPoints[entry.d1] = (overallPoints[entry.d1] || 0) + 3;
          if (entry.d2) overallPoints[entry.d2] = (overallPoints[entry.d2] || 0) + 2;
          if (entry.d3) overallPoints[entry.d3] = (overallPoints[entry.d3] || 0) + 1;
        });
      });

      // Add points from archives
      const archivesData = archivesSnapshot.val() || {};
      Object.values(archivesData).forEach(archive => {
        if (archive.submissions) {
          Object.values(archive.submissions).forEach(entry => {
            if (entry.d1) overallPoints[entry.d1] = (overallPoints[entry.d1] || 0) + 3;
            if (entry.d2) overallPoints[entry.d2] = (overallPoints[entry.d2] || 0) + 2;
            if (entry.d3) overallPoints[entry.d3] = (overallPoints[entry.d3] || 0) + 1;
          });
        }
      });

      // Add points from current submissions
      const currentData = currentSnapshot.val() || {};
      Object.values(currentData).forEach(entry => {
        if (entry.d1) overallPoints[entry.d1] = (overallPoints[entry.d1] || 0) + 3;
        if (entry.d2) overallPoints[entry.d2] = (overallPoints[entry.d2] || 0) + 2;
        if (entry.d3) overallPoints[entry.d3] = (overallPoints[entry.d3] || 0) + 1;
      });

      // Sort players by total points and create final rankings
      const sortedOverall = Object.entries(overallPoints)
        .sort(([, a], [, b]) => b - a)
        .map(([player, totalPoints]) => ({
          player,
          totalPoints,
          votesReceived: {
            threePoints: this.countVotesForPoints(player, 3, previousData, archivesData, currentData),
            twoPoints: this.countVotesForPoints(player, 2, previousData, archivesData, currentData),
            onePoint: this.countVotesForPoints(player, 1, previousData, archivesData, currentData)
          }
        }));

      if (sortedOverall.length > 0) {
        // Find all players with the highest score
        const highestPoints = sortedOverall[0].totalPoints;
        const champions = sortedOverall.filter(player => player.totalPoints === highestPoints);

        // Save full rankings and set state
        set(ref(db, 'overallRankings'), sortedOverall)
          .then(() => {
            this.setState({
              overallChampion: champions, // Now storing array of champions
              showOverallChampionModal: true
            });
          })
          .catch(error => {
            console.error("Error saving overall rankings:", error);
            this.setState({
              overallChampion: champions, // Now storing array of champions
              showOverallChampionModal: true
            });
          });
      } else {
        this.setState({ overallChampion: null, showOverallChampionModal: true });
      }
    }).catch(error => {
      console.error("Error calculating overall champion:", error);
      this.setState({ overallChampion: null, showOverallChampionModal: true });
    });
  };

  // Helper method to count votes for specific point values
  countVotesForPoints = (player, points, previousData, archivesData, currentData) => {
    let count = 0;
    const field = `d${4-points}`; // d1 for 3 points, d2 for 2 points, d3 for 1 point

    // Count in previous submissions
    Object.values(previousData).forEach(dailyData => {
      Object.values(dailyData).forEach(entry => {
        if (entry[field] === player) count++;
      });
    });

    // Count in archives
    Object.values(archivesData).forEach(archive => {
      if (archive.submissions) {
        Object.values(archive.submissions).forEach(entry => {
          if (entry[field] === player) count++;
        });
      }
    });

    // Count in current submissions
    Object.values(currentData).forEach(entry => {
      if (entry[field] === player) count++;
    });

    return count;
  };

  handleCloseOverallChampionModal = () => {
    this.setState({ showOverallChampionModal: false });
  };

  checkAndArchiveData = () => {
    const submissionStatusRef = ref(db, 'submissionStatus');
    const lastArchiveRef = ref(db, 'lastArchiveTime');
    const archivesListRef = ref(db, 'archivesList');
  
    get(submissionStatusRef).then(snapshot => {
      const status = snapshot.val();
      if (status === 'closed') {
        get(lastArchiveRef).then(archiveSnapshot => {
          const lastArchiveTime = archiveSnapshot.val();
          const currentTime = Date.now();
          
          if (!lastArchiveTime || (currentTime - lastArchiveTime) >= 1*1000) {
            const today = new Date().toISOString().split('T')[0];
            
            Promise.all([
              get(ref(db, 'currentSubmissions')),
              get(ref(db, 'currentTopThree'))
            ]).then(([submissionsSnapshot, topThreeSnapshot]) => {
              const archiveData = {
                submissions: submissionsSnapshot.val(),
                topThree: topThreeSnapshot.val(),
                archivedAt: currentTime,
                date: today
              };

              // Save to archive and update archives list
              Promise.all([
                set(ref(db, `archives/${today}`), archiveData),
                push(ref(db, 'archivesList'), {
                  date: today,
                  archivedAt: currentTime
                })
              ]).then(() => {
                // Clear current data
                remove(ref(db, 'currentSubmissions'));
                remove(ref(db, 'currentTopThree'));
                remove(ref(db, 'selectedPlayers'));
                remove(ref(db, 'votedUsers'));
                set(ref(db, 'lastArchiveTime'), currentTime);
              });
            });
          }
        });
      }
    });
  };

  render() {
    const { currentStep, isAdmin, showLogin, userMessage, loading, isAddingPlayer, submissionStatus, showOverallChampionModal, overallChampion, isEditingPlayers, players } = this.state
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
          ) : isEditingPlayers ? (
            <EditPlayers
              players={this.state.players}
              onEditName={this.handleEditPlayerName}
              onRemove={this.handleRemovePlayer}
              onBack={() => this.setState({ isEditingPlayers: false })}
            />
          ) : (
            <AdminPanel
              onAddPlayer={this.handleAddPlayerClick}
              onToggleSubmission={this.handleToggleSubmission}
              onShowOverallChampion={this.handleShowOverallChampion}
              onEditPlayers={this.handleEditPlayersClick}
            />
          )}
          <button
            className="back-button"
            onClick={() => this.setState({ isAdmin: false, isAddingPlayer: false, showOverallChampionModal: false, isEditingPlayers: false })}
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
          <Login onLogin={this.handleAdminLogin} onClose={this.handleAdminToggle} />
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