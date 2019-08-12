import React from "react";
import {Input} from "bitshares-ui-style-guide";
import QRScanner from "../QRAddressScanner";

export default function ScanOrEnterText({
    labelContent,
    handleQrScanSuccess,
    onInputChange,
    inputValue
}) {
    return (
        <div style={{marginBottom: "1em"}}>
            <label className="left-label">{labelContent}</label>

            <div>
                <div className="inline-label">
                    <Input.TextArea
                        style={{marginBottom: 0}}
                        rows={2}
                        onChange={onInputChange}
                        value={inputValue}
                    />
                    <span>
                        <QRScanner
                            label="Scan"
                            onSuccess={handleQrScanSuccess}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}
