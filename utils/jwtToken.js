//create token and saving in cookie

const sendToken=(user, statusCode, res)=>{
    const token=user.getJWTToken();

    //options for cookie
    const options={
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000,
        ),
        secure: process.env.NODE_ENV==="PRODUCTION",
        sameSite: process.env.NODE_ENV==="development"?'Lax':'None',
        httpOnly:true,
    };

    // res.cookie("token_ios", token, {}})
   

    res.status(statusCode).cookie("token", token, options).json({
        success:true,
        user,
        token,
    });
};


module.exports=sendToken;