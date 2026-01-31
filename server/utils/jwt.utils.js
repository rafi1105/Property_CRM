import jwt from 'jsonwebtoken';

// Generate JWT token
export const generateToken = (userId) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    // Ensure expiresIn is valid - default to 7 days
    const expiresIn = process.env.JWT_EXPIRE && process.env.JWT_EXPIRE.trim() ? process.env.JWT_EXPIRE.trim() : '7d';
    
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn }
    );
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw error;
  }
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate token response
export const generateTokenResponse = (user) => {
  try {
    const token = generateToken(user._id);
    
    return {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        authProvider: user.authProvider,
        photoURL: user.photoURL
      }
    };
  } catch (error) {
    console.error('Error generating token response:', error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};
