const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user or user not active'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userData = user;

    socket.join(socket.userId);

    if (user.role === 'seller' || user.role === 'admin') {
      socket.join('sellers');
    }

    if (user.role === 'admin') {
      socket.join('admins');
    }

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
