import { body, validationResult } from 'express-validator';
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            error: errors.array().map((err) => err.msg).join(', ')
        });
        return;
    }
    next();
};
export const validateArticle = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('excerpt').trim().notEmpty().withMessage('Excerpt is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('image').trim().notEmpty().withMessage('Image is required'),
    body('author').trim().optional(),
    body('date').optional().isString(),
    body('featured').optional().isBoolean(),
    body('requiresSubscription').optional().isBoolean(),
    handleValidationErrors
];
export const validateMagazine = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('issueNumber').trim().notEmpty().withMessage('Issue number is required'),
    body('coverImage').trim().notEmpty().withMessage('Cover image is required'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('priceDigital').optional().isNumeric(),
    body('pricePhysical').optional().isNumeric(),
    body('isFree').optional().isBoolean(),
    body('gatedPage').optional().isNumeric(),
    body('blurPaywall').optional().isBoolean(),
    handleValidationErrors
];
export const validateAuth = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];
export const validateSubscription = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    handleValidationErrors
];
