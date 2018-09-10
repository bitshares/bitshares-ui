import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default callback => {
    const content = document.getElementById("mainContainer");
    const footerHeight = document.getElementsByClassName("footer")[0]
        .clientHeight;
    const typeSize = 3.8; //mm
    const width = window.innerWidth / typeSize;
    const height = window.innerHeight / typeSize - footerHeight;

    html2canvas(content).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "landscape",
            format: [width, height]
        });

        pdf.addImage(imgData, "JPEG", 0, 0);
        pdf.save("download.pdf");

        if (typeof callback == "function") {
            callback();
        }
    });
};
