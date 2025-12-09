import { Router } from 'express';
import { loginUser, registerUser } from '../services/authService';

const router = Router();

router.get('/login', (req, res) => {
  if (req.currentUser) return res.redirect('/dashboard');
  res.render('auth-login', { layout: 'main', title: 'Login' });
});

router.get('/register', (req, res) => {
  if (req.currentUser) return res.redirect('/dashboard');
  res.render('auth-register', { layout: 'main', title: 'Sign Up' });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const { user, token } = await registerUser({ name, email, password });
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'lax' })
      .redirect('/dashboard');
  } catch (err: any) {
    res.status(400).render('auth-register', {
      layout: 'main',
      title: 'Sign Up',
      error: err.message,
      form: { name, email },
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await loginUser({ email, password });
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'lax' })
      .redirect('/dashboard');
  } catch (err: any) {
    res.status(400).render('auth-login', {
      layout: 'main',
      title: 'Login',
      error: err.message,
      form: { email },
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token').redirect('/auth/login');
});

export default router;
