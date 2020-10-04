import nacl from 'tweetnacl-es6'


export default class CryptoWrapper
{
    static sign(message, privkey)
    {
        if(!privkey)
        {
            throw new Error("CW needs private key")
        }
        const te = new TextEncoder();
        privkey = CryptoWrapper.hexToBuffer(privkey);
        message = te.encode(message);
        const signature = nacl.sign.detached(message, privkey);
        return CryptoWrapper.bufferToHex(signature);
    }
    static verify(message, signature, pubkey)
    {
        if(!pubkey)
        {
            throw new Error("CW needs public key")
        }
        const te = new TextEncoder();
        pubkey = CryptoWrapper.hexToBuffer(pubkey);
        signature = CryptoWrapper.hexToBuffer(signature);
        message = te.encode(message);
        const verification = nacl.sign.detached.verify(message, signature, pubkey);
        return true;

    }

    static encrypt(message, nonce, pubkey, privkey)
    {
        const te = new TextEncoder();
        message = te.encode(message);
        nonce = CryptoWrapper.hexToBuffer(nonce);
        pubkey = CryptoWrapper.hexToBuffer(pubkey);
        privkey = CryptoWrapper.hexToBuffer(privkey);
        const ciphertext = nacl.box(message, nonce, pubkey, privkey);
        if(ciphertext == null)
            throw new Error("Encrypt failed");
        return CryptoWrapper.bufferToHex(ciphertext);
    }
    static decrypt(message, nonce, pubkey, privkey)
    {
        const te = new TextDecoder("utf-8");
        message = CryptoWrapper.hexToBuffer(message);
        nonce = CryptoWrapper.hexToBuffer(nonce);
        pubkey = CryptoWrapper.hexToBuffer(pubkey);
        privkey = CryptoWrapper.hexToBuffer(privkey);
        const plaintext = te.decode(nacl.box.open(message, nonce, pubkey, privkey));
        if(plaintext == null)
            throw new Error("Decrypt failed");
        console.log("Plaintext: "+plaintext)
        return plaintext;

    }

    static generateEncryptionKeyPair()
    {
        return CryptoWrapper._returnKeyPair(nacl.box.keyPair());
    }

    static generateAuthKeyPair()
    {
        return CryptoWrapper._returnKeyPair(nacl.sign.keyPair());
    }

    static generateUniqueId()
    {
        const bytes = nacl.randomBytes(nacl.box.nonceLength);
        return CryptoWrapper.bufferToHex(bytes);
    }

    static _returnKeyPair(keypair)
    {
        const public_key = CryptoWrapper.bufferToHex(keypair.publicKey);
        const private_key = CryptoWrapper.bufferToHex(keypair.secretKey);
        return {
            public_key:public_key,
            private_key: private_key
        };
    }
    static bufferToHex(buffer) {
        return "0x"+[...new Uint8Array(buffer)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    static hexToBuffer(hexString) {
        // remove the leading 0x
        hexString = hexString.replace(/^0x/, '');
        
        // ensure even number of characters
        if (hexString.length % 2 != 0) {
            throw new Error('WARNING: expecting an even number of characters in the hexString');
        }
        
        // check for some non-hex characters
        const bad = hexString.match(/[G-Z\s]/i);
        if (bad) {
            throw new Error('WARNING: found non-hex characters', bad);    
        }
        
        // split the string into pairs of octets
        const pairs = hexString.match(/[\dA-F]{2}/gi);
        
        // convert the octets to integers
        const integers = pairs.map(function(s) {
            return parseInt(s, 16);
        });
        
        const array = new Uint8Array(integers);
        
        return array;
    }
};

// Test
const hex = "0x4546474849";
const buffer = CryptoWrapper.hexToBuffer(hex);
const newhex = CryptoWrapper.bufferToHex(buffer);
if (newhex !== hex)
{
    throw new Error(`Buffer/hex conversion doesn't work:
    ${newhex} != ${hex}
    `)
}