import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { auth, db } from './firebase';

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isLogin, setIsLogin] = useState(false);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('client');

  const [formData, setFormData] = useState({ 
    email: '', password: '', name: '', phone: '' 
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await currentUser.reload();
        setUser(currentUser);
        
        if (currentUser.emailVerified) {
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          if (snap.exists()) {
            setUserProfile(snap.data());
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('Processing...');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const currentUser = res.user;

        await sendEmailVerification(currentUser);

        await setDoc(doc(db, "users", currentUser.uid), {
          uid: currentUser.uid,
          email: formData.email,
          role: role,
          name: formData.name,
          phone: formData.phone,
          createdAt: new Date()
        });
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setFormData({ email: '', password: '', name: '', phone: '' });
    setMessage('');
  };

  if (loading) return <div>Loading...</div>;

  if (user && user.emailVerified && userProfile) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {userProfile.name}</p>
        <p>Role: {userProfile.role}</p>
        <p>Phone: {userProfile.phone}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div>
        <h2>Verify your Email</h2>
        <p>We sent a verification link to: <b>{user.email}</b></p>
        <button onClick={() => window.location.reload()}>I verified my email</button>
        <br /><br />
        <button onClick={handleLogout}>Back / Logout</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>

      {message && <p>{message}</p>}

      <form onSubmit={handleAuth}>
        
        {!isLogin && (
          <>
            <label>I am a: </label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Client</option>
              <option value="supplier">Supplier</option>
            </select>
            <br /><br />

            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
            <br /><br />

            <input type="tel" name="phone" placeholder="Phone Number" onChange={handleChange} required />
            <br /><br />
          </>
        )}

        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <br /><br />
        
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <br /><br />

        <button type="submit">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <br />
      <button onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
        {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
      </button>

    </div>
  );
}

export default App;
// comment