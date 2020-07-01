const express = require('express');
const bodyParser = require('body-parser');

const { vouchers } = require('./in-memoryDb');

const { checkAmount, verifyEmail, sendMessage, codeGenerator, generatePin } = require('./util');

const app = express();

app.use(bodyParser.json());

const PORT = 5050;
const MAX_TX = 5;

    // const obj = {
    //     voucher_amount : voucher_amount,
    //     current_amount: voucher_amount,
    //     email: email,
    //     code: codeGenerator(),
    //     voucher_pin: generatePin(),
    //     voucher_createdAt: new Date(),
    //     status: 'active',
    //     transaction_count: 0,
    //     last_transaction: null
    // };

app.post('/generate-voucher', (req, res) => {
    const email = req.body.email;
    const voucher_amount = req.body.voucher_amount;
    if(email == null && email == undefined) {
        res.send({
            message: 'Unknown email account.'
        });
    }

    const obj = {
        voucher_amount : voucher_amount,
        current_amount: voucher_amount,
        email: email,
        code: codeGenerator(),
        voucher_pin: generatePin(),
        voucher_createdAt: new Date(),
        status: 'active',
        transaction_count: 0,
        last_transaction: null
    };

    vouchers.insertOne(obj);
    // call function to send email.

    const message = "Voucher generated, code = "+obj.code+ " pin = "+obj.voucher_pin+ " amount = "+obj.voucher_amount ;
    sendMessage(message);

    res.send(obj);
});

app.post('/redeem-voucher', (req, res) => {
    const email = req.body.email;
    const redeem_amount = req.body.redeem_amount;
    const voucher_code = req.body.code;
    const pin = req.body.voucher_pin;
    if(!checkAmount(voucher_code, redeem_amount)) {
        res.send({
            message: "Already redeemed."
        })
    }

    if(verifyEmail(email)) {
        const record = vouchers.findOne({code: voucher_code});
        record.transaction_count++;

        /**
         * Check maximum transaction
         */

        if(record.transaction_count > MAX_TX) {
            res.send({
                message: "Maximum transaction reached."

            });
            exit();
        }

        /**
         * Check last transaction time
         */
        

        const current_time = new Date();
        if(record.last_transaction > 0 && (record.last_transaction - current_time <=10)) {
            res.send({
                message: "Please try after 10 minutes "
            });

            exit();

        } 

        if(record.current_amount > 0){

         record.current_amount = record.current_amount - redeem_amount;

            record.status = 'partially active';
            record.last_transaction = new Date();

            const message = "Voucher redeemed partially, code = "+voucher_code+ " Redeem Amount = "+redeem_amount+ " current Amount = "+record.current_amount;
            sendMessage(message);

        } else {
            record.status = 'redeemed';

            const message = "Voucher redeemed fully, code = "+voucher_code+ " Redeem Amount = "+redeem_amount;
            sendMessage(message);

        }

        vouchers.update(record);

        /**
         * create a string(message), function(message);
         */
        res.send({
            message: 'Redemption successfull.'
        })
    } else {
        res.send({
            message: "Invalid email" 
        })
    }
});

/**
 * URL format - http://localhost:5050/get-voucher?email=abc@xyz.com&status=active
 */
app.get('/get-voucher', async (req, res) => {
    const from = req.query.from;
    const to = req.query.to;

    // if to is not present in the query , then assume 'to' value to current time,
    // if from is not available and to is  available then ignore time filter.


    const email = req.query.email;
    const status = req.query.status;
    // const time = vouchers.findOne({code: voucher_createdAt});
    let query = {};
        if(from) {
            if(!to) {
                query = {
                    voucher_createdAt : {
                        $lte : new Date(),
                        $gte : from
                    }
                }
            } else {
                query = {
                    voucher_createdAt : {
                        $lte : new Date(to),
                        $gte : from
                    }
                }
            }
        }
        if(email) {
            query.email = email;
        }
        if(status) {
            query.status = status;
        }

        console.log(query);

        const response = await vouchers.find(query);
        res.send(response);
    });

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
