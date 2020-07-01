const { vouchers } = require('./in-memoryDb');

function checkAmount(code, redeemAmount) {
    const result = vouchers.findOne({code: code});
    if(result.current_amount >= redeemAmount) {
        return true;
    } else {
        return false;
    }
}

function verifyEmail(email) {
    const result = vouchers.find({email: email});
    if(result.length > 0) {
        return true;
    } else
        return false;
}

function generatePin() {
    return Math.floor(Math.random()*90000) + 10000;
}

function codeGenerator() {
    return 'VCD'+Math.floor(Math.random()*9000000000) + 1000000000;
}

function sendMessage(message) {

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    //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
    const msg = {
      to: 'anshikakaushik029@gmail.com',
      from: 'anshikakaushik029@gmail.com',
      subject: 'Voucher mangement system',
      text: message,
    };

    sgMail.send(msg).catch(function(error){
        console.log(error);
    });

}
module.exports = {
    checkAmount: checkAmount,
    verifyEmail: verifyEmail,
    generatePin: generatePin,
    sendMessage: sendMessage,
    codeGenerator: codeGenerator
};