import {Transaction} from "./Transaction";
import constants from "./constants";
import tb from "./TransactionBox";
import cw from "./CryptoWrapper";
import ledger from './Ledger'

export async function createUser(email="null@nasa.com")
{
  const keypair = cw.generateAuthKeyPair();
  const data = {
    "public_key": keypair.public_key,
    "email": email,
  }
  const url = constants.BOUNCER_SERVER + constants.BOUNCER_API_CREATE_USER;
  const raw_response =  await fetch(url,{
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const content = await raw_response.json();
  const ta = new Transaction(content);
  if(!(ta.verify(constants.BOUNCER_PUBKEY)))
  {
    throw new Error("Initial transaction invalid")
  }

  tb.sendTransactions([ta]);
  
  const cred = {
      id: ta.for,
      private_key: keypair.private_key,
      public_key: keypair.public_key,
  }
  ledger.saveCredentials(cred)
  return cred;
}