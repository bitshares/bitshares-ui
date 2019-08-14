import React from "react";
import PropTypes from "prop-types";
import {Input} from "bitshares-ui-style-guide";
import QRScanner from "../QRAddressScanner";

export default function ScanOrEnterText({
    labelContent,
    handleQrScanSuccess,
    onInputChange,
    inputValue,
    submitBtnText,
    dataFoundText
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
                            submitBtnText={submitBtnText}
                            dataFoundText={dataFoundText}
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
    inputValue: PropTypes.string,
    submitBtnText: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    dataFoundText: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
};
