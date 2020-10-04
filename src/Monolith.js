/* 
    Yes, this is a god object.
    It's a hackathon and I'm delirious

    Leave me alone
*/

import {Transaction} from "./Transaction";
import tb from "./TransactionBox";
import constants from "./constants";
import ledger from "./Ledger";
import cw from "./CryptoWrapper"

class Message
{
    constructor(transaction, pubkey)
    {
        this.timestamp = transaction.timestamp;
        this.origin = transaction.origin;
        this.for = transaction.for;
        const private_key = ledger.getEphemeralKeypair(
            this.origin == ledger.getCredentials().id? 
                transaction.for:transaction.origin
            ).private_key;
        if(!transaction.content)
            throw new Error("NO CONTENT");
        if(!transaction.nonce)
            throw new Error("NO NONCE");
        if(!pubkey)
            throw new Error("NO PUBKEY");
        if(!private_key)
            throw new Error("NO PRIVATE_KEY");
        this.content = cw.decrypt(transaction.content, transaction.nonce, pubkey, private_key);
    }
}
class User
{
    constructor()
    {
        this.available_properties = ["id", "public_key", "blurb",
        "ephemeral_key", "liked", "likes_back",
        "picture", "gender", "age","location","name"];
        this.messages = [];
    }

    update(prop, tkey, transaction)
    {
        if(!(this.available_properties.includes(prop)))
        {
            throw new Error("Not a valid property")
        }
        const preprop = prop;
        prop = "_"+prop;
        if(!(transaction instanceof Transaction))
            throw new Error("transaction not Transaction")
        if(prop == null || tkey == null)
            throw new Error("bad args to ::update");
        if(typeof tkey !== "string")
            throw new Error("tkey should be string(so should prop)");

        if(!(this[prop]) || this[prop].timestamp < transaction.timestamp)
        {
            this[prop] = {
                "value": transaction[tkey],
                "timestamp": transaction["timestamp"]
            }
            this[preprop] = transaction[tkey];
        }
    }

    get data()
    {
        const d = {};
        for(const prop of this.available_properties)
        {
            d[prop] = this[prop];
        }
        d["messages"] = this["messages"];
        return d;
    }


}
class Monolith
{
    constructor()
    {
        this.users = {};
        const self = new User();
        const cred = ledger.getCredentials();
        self.id = cred.id;
        self.public_key = cred.public_key;
        this.users[self.id] = self;

        this.callbacks = [];

        // These need to be pushed back to TransactionBox, eventually
        this.unconfirmed_transactions = [];
    }

    initiate()
    {
        tb.setProcessCallback(this._process.bind(this),
        ()=>{
            if(this.unconfirmed_transactions.length)
            {
            }
        }
        );
    }

    async _process(transaction)
    {
        if(transaction.type === Transaction.TRANSACTION_TYPE_NEW_PUBKEY)
        {
            // Eek! New User
            // Let's first confirm this is legit though
            if(!transaction.verify(constants.BOUNCER_PUBKEY))
            {
                console.error("Invalid new_public_key transaction")
                return null;
            }
            const id = transaction["for"];
            if(!this.users[id])
            {
                this.users[id] = new User();
            }
            const user =this.users[id];
            user.update("id", "for", transaction);
            user.update("public_key", "content", transaction);
        }
        else
        {
            // User transaction - confirm validity
            const id = transaction.origin;
            const user = this.users[id];
            if(!id || !user || !transaction.verify(user.public_key))
            {
                console.log("Unconfirmed user transaction, pushing back", transaction);
                this.unconfirmed_transactions.push(transaction);
                return null;
            }

            if(transaction.type === Transaction.TRANSACTION_TYPE_UPDATE_BIO)
            {
                if(["gender","age","location","name","blurb".includes(transaction.for)])
                {
                    user.update(transaction.for, "content", transaction);
                }
                else
                {
                    console.error("Unknown update_bio suptype: "+transaction.for);
                    return null;
                }
            }
            else if(transaction.origin == ledger.getCredentials().id)
            {
                // Something WE created
                // Our baby
                // Our precious precious baby

                const obj_of_affection = this.users[transaction.for];
                if (!obj_of_affection) {
                    console.log("Unconfirmed message from us("+transaction.nonce+transaction.for+"), pushing back");
                    this.unconfirmed_transactions.push(transaction);
                    return null;
                }

                if(transaction.type === Transaction.TRANSACTION_TYPE_LIKE)
                {
                    obj_of_affection.update("liked", "nonce", transaction);
                    console.log("You like someone")
                }
                else if(transaction.type === Transaction.TRANSACTION_TYPE_MESSAGE)
                {
                    if(!obj_of_affection.ephemeral_key)
                    {
                        console.log("No ephemeral key yet");
                        this.unconfirmed_transactions.push(transaction);
                        return null;
                    }
                    if(transaction.version >= Transaction.CURRENT_TRANSACTION_VERSION)
                        obj_of_affection.messages.push(new Message(transaction, obj_of_affection.ephemeral_key));
                }
                else
                {
                    console.error("Unknown type "+ transaction.type);
                    return null;
                }
            }
            else
            {
                // Discard if not for us
                const dest = transaction.for;
                if(dest != ledger.getCredentials().id)
                {
                    return null
                }
                
                if (transaction.type === Transaction.TRANSACTION_TYPE_LIKE)
                {
                    // recieve ephemeral public key
                    user.update("ephemeral_key", "content", transaction);
                    user.update("likes_back", "nonce", transaction);
                    console.log("Someone likes you")
                }
                else if(transaction.type === Transaction.TRANSACTION_TYPE_MESSAGE)
                {
                    if(!(user.ephemeral_key))
                    {
                        console.log("No ephemeral key yet");
                        this.unconfirmed_transactions.push(transaction);
                        return null;
                    }
                    console.log("Ephemeral key:", user.ephemeral_key)
                    if(transaction.version >= Transaction.CURRENT_TRANSACTION_VERSION)
                        user.messages.push(new Message(transaction, user.ephemeral_key));
                }
                else
                {
                    console.error("Unknown type "+ transaction.type);
                    return null;
                }
            }
        }
        for(const callback of this.callbacks)
        {
            callback();
        }
        return transaction;
    }
}

const mono = new Monolith();
export default  mono;