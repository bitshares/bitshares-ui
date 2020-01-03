import jsPDF from "jspdf";
import QRCode from "qrcode";
import WalletDb from "stores/WalletDb";
import image from "../../assets/icons/paper-wallet-header.png";

const _createPaperWalletAsPDF = function(
    ownerkeys,
    activeKeys,
    memoKey,
    accountName
) {
    const width = 300,
        height = 450, //mm
        lineMargin = 5,
        qrSize = 50,
        textMarginLeft = qrSize + 7,
        qrMargin = 5,
        qrRightPos = width - qrSize - qrMargin,
        textWidth = width * 1.75 - qrSize * 2 - qrMargin * 2 - 3,
        textHeight = 13,
        logoWidth = (width * 3) / 4,
        logoHeight = logoWidth / 2.8, //  logo original width/height=2.8
        logoPositionX = (width - logoWidth) / 2;
    let rowHeight = logoHeight + 50;
    const keys = [activeKeys, ownerkeys, memoKey];
    const keysName = ["Active Key", "Owner Key", "Memo Key"];

    let locked = WalletDb.isLocked();

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        // format: [width, height],
        compressPdf: true
    });

    const checkPageH = (pdfInstance, currentPageH, maxPageH) => {
        if (currentPageH >= maxPageH) {
            pdfInstance.addPage();
            rowHeight = 10;
        }
        return pdf.internal.getNumberOfPages();
    };

    const keyRow = publicKey => {
        let currentPage = checkPageH(pdf, rowHeight, 400);
        let privateKey = null;
        if (!locked) {
            privateKey = WalletDb.getPrivateKey(publicKey);
            if (!!privateKey) {
                privateKey = privateKey.toWif();
            }
        }
        gQrcode(publicKey, qrMargin, rowHeight + 10, currentPage);
        pdf.text("PublicKey", textMarginLeft, rowHeight + 20);
        pdf.text(publicKey, textMarginLeft, rowHeight + 35);
        pdf.rect(textMarginLeft - 1, rowHeight + 25, textWidth, textHeight);
        if (!locked) {
            if (!!privateKey) {
                gQrcode(privateKey, qrMargin, rowHeight + 70, currentPage);
            }

            pdf.text("PrivateKey", textMarginLeft, rowHeight + 90);
            if (!!privateKey) {
                pdf.text(privateKey, textMarginLeft, rowHeight + 105);
            } else {
                pdf.text("Not found.", textMarginLeft, rowHeight + 105);
            }
            pdf.rect(textMarginLeft - 1, rowHeight + 95, textWidth, textHeight);
            rowHeight += 110;
        } else {
            rowHeight += 55;
        }
    };

    const gQrcode = (qrcode, rowWidth, rowHeight, currentPage) => {
        QRCode.toDataURL(qrcode)
            .then(url => {
                pdf.setPage(currentPage);
                pdf.addImage(url, "JPEG", rowWidth, rowHeight, qrSize, qrSize);
            })
            .catch(err => {
                console.error(err);
            });
    };

    let img = new Image();
    img.src = image;
    pdf.addImage(
        img,
        "PNG",
        logoPositionX,
        30,
        logoWidth,
        logoHeight,
        "",
        "MEDIUM"
    );
    pdf.text("Account:", 18, rowHeight - 10);
    pdf.text(accountName, 70, rowHeight - 10);

    let content = keys.map((publicKeys, index) => {
        if (index >= 1) {
            rowHeight += 25; // add margin-top for block
        }
        checkPageH(pdf, rowHeight, 400);

        pdf.line(lineMargin, rowHeight - 3, width - lineMargin, rowHeight - 3); // top line
        pdf.text(keysName[index], 120, rowHeight + 7);
        pdf.line(lineMargin, rowHeight + 9, width - lineMargin, rowHeight + 9); // bottom line
        if (typeof publicKeys === "string") {
            keyRow(publicKeys);
        } else {
            publicKeys.map(publicKey => {
                keyRow(publicKey);
            });
        }
    });

    Promise.all(content).then(() => {
        pdf.save(
            "tusc" +
                "-paper-wallet-" +
                (locked ? "public-" : "private-") +
                accountName +
                ".pdf"
        );
    });
};

const createPaperWalletAsPDF = function(account) {
    let getKeys = function(target) {
        let key_auths = account.get(target).get("key_auths");
        return key_auths.map(a => a.get(0));
    };

    _createPaperWalletAsPDF(
        getKeys("owner"),
        getKeys("active"),
        account.get("options").get("memo_key"),
        account.get("name")
    );
};

export {createPaperWalletAsPDF};
