import cw from './CryptoWrapper';
export class Transaction
{
    constructor(obj)
    {
        this._setFields();
        if(obj)
        {
            if(!obj.type)
            {
                console.log("Obj", obj)
                console.error("Can't form Transaction without type")
            }
            if (obj.version) this.version = obj.version;
            if (obj.type) this.type = obj.type;
            if (obj.origin) this.origin = obj.origin;
            if (obj.for) this.for = obj.for;
            if (obj.content) this.content = obj.content;
            if (obj.nonce) this.nonce = obj.nonce;
            if (obj.timestamp) this.timestamp = obj.timestamp;
            if (obj.signature) this.signature = obj.signature;
        }
    }

    get data()
    {
        return{
            signature: this.signature,
            version: this.version,
            type: this.type,
            origin: this.origin,
            "for": this.for,
            content: this.content,
            nonce: this.nonce,
            timestamp: this.timestamp
        }
    }

    get message(){
        throw new Error("NOT A PROPERTY YOU LONG EARED GALOOT");
    }
    get dest(){
        throw new Error("NOT A PROPERTY YOU LONG EARED GALOOT");
    }
    get destination(){
        throw new Error("NOT A PROPERTY YOU LONG EARED GALOOT");
    }

    isStamped()
    {
        if(this.version === null||
            this.type == null ||
            this.origin === null||
            this.for == null ||
            this.content == null||
            this.nonce == null||
            this.signature == null||
            this.timestamp == null
            )
        {
            return false;
        };
        return true;
    }

    async stamp(private_key)
    {
        if(this.version === null||
            this.type == null ||
            this.origin == null||
            this.for == null ||
            this.content == null
            )
        {
            throw new Error("Transaction not ready to stamp");
        };

        if(!private_key)
        {
            throw new Error("Transaction needs private key to sign");
        }
        
        this.nonce = await cw.generateUniqueId();
        this.timestamp = + new Date();
        this.signature = cw.sign(this._getMergedMessage(), private_key);
    }
    verify(public_key)
    {
        if(!public_key)
        {
            throw new Error("Transaction needs public key to verify");
        }
        const merged_message = this._getMergedMessage();
        return cw.verify(merged_message, this.signature, public_key);
    }
    _setFields()
    {
        this.version = Transaction.CURRENT_TRANSACTION_VERSION;
        this.type = null;
        this.origin = null;
        this.for = null;
        this.content = null;
        
        // Stamp
        this.timestamp = null;
        this.nonce = null;
        this.signature = null;
    }
    _getMergedMessage()
    {
        const merged_message = this.version + this.type + this.origin
        + this.for + this.content + this.timestamp + this.nonce;
        if(typeof merged_message != 'string' && !(merged_message instanceof String))
        {
            throw new Error("Couldn't merge message");
        }
        return merged_message;
    }
}
Transaction.CURRENT_TRANSACTION_VERSION="1";

Transaction.TRANSACTION_TYPE_NEW_PUBKEY = "new_pubkey";
Transaction.TRANSACTION_TYPE_UPDATE_BIO = "update_bio";
Transaction.TRANSACTION_TYPE_MESSAGE = "message_user";
Transaction.TRANSACTION_TYPE_LIKE = "like_user";


// Test
const keypair = cw.generateAuthKeyPair();
const t = new Transaction();
t.type="4";
t.origin="test1";
t.for="sfsad";
t.content="adfsdf";
t.stamp(keypair.private_key).then(res=>{
    if(!t.verify(keypair.public_key))
    {
        throw new Error("FUCK");
    }
    else
    {
        console.log("It's all good, baby")
    }
});