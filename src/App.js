import "./App.css";
import OneKeyConnect from "@onekeyfe/js-sdk";
import { useCallback, useEffect, useState } from "react";
import { Button, Code, Input, Text, Textarea, useToasts } from "@geist-ui/core";
import { parse, serialize } from "@ethersproject/transactions";

function App() {
  const [path, setPath] = useState("m/44'/60'/0'/0/0");
  const [address, setAddress] = useState("");
  const [tx, setTx] = useState("");
  const [txHex, setTxHex] = useState("");
  const { setToast } = useToasts();

  const getOneKeyAddress = useCallback(async () => {
    const resp = await OneKeyConnect.ethereumGetAddress({
      path,
      showOnTrezor: false,
    });

    setAddress(resp.payload.address);
  }, [path]);

  const formatAndUpdateTx = useCallback(async (tx) => {
    const formatTx = JSON.stringify(JSON.parse(tx), undefined, 2);
    setTx(formatTx);
    console.log("tx: ", formatTx);
  }, []);

  const signTx = useCallback(async () => {
    let txObj = undefined;

    try {
      txObj = JSON.parse(tx);
    } catch (e) {
      // pass
    }

    if (!path || !address || typeof txObj !== "object") {
      setToast({ type: "error", text: "no address or invalid tx" });
      return;
    }

    const unsignedTx = {
      chainId: Number(txObj.chainId),
      to: txObj.to,
      value: txObj.value,
      gasPrice: txObj.gasPrice,
      gasLimit: txObj.gasLimit,
      nonce: hexNumber(txObj.nonce),
      data: txObj.data,
    };

    const resp = await OneKeyConnect.ethereumSignTransaction({
      path,
      transaction: unsignedTx,
    });

    const { r, s, v } = resp.payload;
    const signedTx = serialize(
      {
        ...unsignedTx,
      },
      { r, s, v: Number(v) }
    );

    setTxHex(signedTx);
  }, [address, tx, setToast]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text mr={"12px"}>Path: </Text>
        <Input value={path} onChange={(e) => setPath(e.target.value)} />
        <Button ml={"8px"} auto onClick={getOneKeyAddress}>
          Get Address
        </Button>
      </div>
      <Text>{address || "No Address"}</Text>
      <Textarea
        w={"500px"}
        h={"400px"}
        placeholder="Please enter transaction"
        value={tx}
        onChange={(e) => setTx(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            formatAndUpdateTx(tx);
          }
        }}
      />
      <Button mt={"16px"} onClick={signTx}>
        Sign
      </Button>
      <Text>Raw Transaction: </Text>
      <Textarea w={"500px"} h={"100px"} style={{}} value={txHex} />
    </div>
  );
}

const hexNumber = (val) => {
  let s = val.toString(16);
  s = s.length % 2 === 0 ? s : `0${s}`;
  return `0x${s}`;
};

export default App;
