import React from "react";
import PropTypes from "prop-types";
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
                        rows={3}
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

ScanOrEnterText.propTypes = {
    labelContent: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    handleQrScanSuccess: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
    inputValue: PropTypes.string
};
