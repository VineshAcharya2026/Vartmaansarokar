import { AuthService } from '../services/AuthService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { UserRole } from '../../types.js';
const authService = new AuthService();
export const signup = asyncHandler(async (req, res) => {
    const { email, name, password, role } = req.body;
    const result = await authService.signup(email, name, password, role || UserRole.EDITOR);
    res.status(201).json({ success: true, message: 'Account created successfully.', data: result });
});
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, message: 'Login successful.', data: result });
});
export const googleLogin = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        res.status(400).json({ success: false, message: 'Google credential token is required.' });
        return;
    }
    const result = await authService.googleLogin(credential);
    res.json({ success: true, message: 'Google login successful.', data: result });
});
export const quickLogin = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.quickLogin(email);
    res.json({ success: true, message: 'Quick login successful.', data: result });
});
export const refreshToken = asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.user.id);
    res.json({ success: true, message: 'Token refreshed.', data: result });
});
export const logout = asyncHandler(async (_req, res) => {
    await authService.logout();
    res.json({ success: true, message: 'Logout successful.', data: { ok: true } });
});
export const activateDigitalSubscription = asyncHandler(async (_req, res) => {
    res.status(501).json({
        success: false,
        message: 'Digital subscription activation is not part of the CMS staff workflow.',
        error: 'Not implemented'
    });
});
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = authService.getCurrentUser(req.user.id);
    res.json({ success: true, message: 'Authenticated user loaded.', data: { user } });
});
