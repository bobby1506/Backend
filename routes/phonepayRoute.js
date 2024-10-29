const express =require("express");
const {
    initiatePayment, validatePayment
} = require("../controllers/phonepayGateway");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router = express.Router();


router
  .route("/pay/:orderId/:userId")
  .post(isAuthenticatedUser,initiatePayment);

router.route("/payment/validate/:merchantTransactionId").get(isAuthenticatedUser, validatePayment);

module.exports = router;