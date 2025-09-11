// frontend/components/auth/AuthPage.jsx

import React from 'react';
import Login from './Login';
// No longer need to import SignUp or manage state here

const AuthPage = () => {
  // This component now only needs to render the Login page.
  return <Login />;
};

export default AuthPage;