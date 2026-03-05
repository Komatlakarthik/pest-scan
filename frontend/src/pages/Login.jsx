import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg'>
            <LogIn className='w-10 h-10 text-green-600' />
          </div>
          <h1 className='text-3xl font-bold text-white mb-2'>Welcome Back!</h1>
          <p className='text-green-100'>Sign in to continue to Smart Pest Doctor</p>
        </div>
        <div className='bg-white rounded-2xl shadow-2xl p-8'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Username</label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input type='text' value={username} onChange={(e) => setUsername(e.target.value)} className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent' placeholder='Enter your username' disabled={loading} />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Password</label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className='w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent' placeholder='Enter your password' disabled={loading} />
                <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                  {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>
            <button type='submit' disabled={loading} className='w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2'>
              {loading ? (<><div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>Signing in...</>) : (<><LogIn className='w-5 h-5' />Sign In</>)}
            </button>
          </form>
          <div className='mt-6 text-center'>
            <p className='text-gray-600'>Don't have an account? <Link to='/signup' className='text-green-600 font-semibold hover:text-green-700'>Sign Up</Link></p>
          </div>
        </div>
        <p className='text-center text-green-100 text-sm mt-6'> 2024 Smart Pest Doctor. All rights reserved.</p>
      </div>
    </div>
  );
}
