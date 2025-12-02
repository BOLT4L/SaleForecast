const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const userController = require("../controllers/userController");

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: ['Manager', 'Planner', 'Owner', 'Admin'] }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Validation error }
 */
router.post(
  "/",
  auth,
  role("Admin", "Owner"),
  [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Valid email is required").isEmail(),
    check("password", "Password must be at least 8 characters").isLength({
      min: 8,
    }),
    check("role", "Valid role is required").isIn([
      "Manager",
      "Planner",
      "Owner",
      "Admin",
    ]),
  ],
  userController.createUser
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *     responses:
 *       200: { description: Users list }
 */
router.get("/", auth, role("Admin", "Owner"), userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: ['Manager', 'Planner', 'Owner', 'Admin'] }
 *     responses:
 *       200: { description: User updated }
 *       404: { description: User not found }
 */
router.put(
  "/:id",
  auth,
  role("Admin", "Owner"),
  [
    check("username", "Username is required").optional().not().isEmpty(),
    check("email", "Valid email is required").optional().isEmail(),
    check("password", "Password must be at least 8 characters")
      .optional()
      .isLength({ min: 8 }),
    check("role", "Valid role is required")
      .optional()
      .isIn(["Manager", "Planner", "Owner", "Admin"]),
  ],
  userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 *       404: { description: User not found }
 */
router.delete("/:id", auth, role("Admin", "Owner"), userController.deleteUser);

module.exports = router;
