const imagePreview = document.getElementById("imagepreview");
const file = document.getElementById("file");
const image = document.getElementById("image");
const hideData = document.getElementById("hidedata");

const beforeHide = document.getElementById("beforehide");
const afterHide = document.getElementById("afterhide");
const contextBeforeHide = beforeHide.getContext("2d");
const contextAfterHide = afterHide.getContext("2d");

let fileBuffer,
  imageData,
  index = 0;

file.addEventListener("change", (e) => {
  const f = e.target.files[0];
  const fr = new FileReader();

  fr.addEventListener("load", (e) => {
    if (e.target.readyState == FileReader.DONE) {
      const arrayBuffer = e.target.result;
      fileBuffer = new Uint8Array(arrayBuffer);
    }
  });

  fr.readAsArrayBuffer(f);
});

image.addEventListener("change", (e) => {
  const img = e.target.files[0];
  const fr = new FileReader();

  fr.addEventListener("load", (e) => {
    if (e.target.readyState == FileReader.DONE) {
      imagePreview.src = e.target.result;
    }
  });

  fr.readAsDataURL(img);
});

hideData.addEventListener("submit", (e) => {
  e.preventDefault();

  const img = image.files[0];
  const fr = new FileReader();

  fr.addEventListener("loadend", (e) => {
    const tmpImg = new Image();

    tmpImg.src = e.target.result;

    tmpImg.onload = () => {
      contextBeforeHide.drawImage(tmpImg, 0, 0);

      imageData = contextBeforeHide.getImageData(
        0,
        0,
        beforeHide.height,
        beforeHide.width
      );
      
      // Membaca semua bits dan menggantikannya
      readByte(fileBuffer);

      contextAfterHide.putImageData(imageData, 0, 0);
    };
  });

  fr.readAsDataURL(img);
});

/**
 *  Konversi ke bit untuk setiap karakter yang ada
 */
const readByte = (buffer) => {
  /**
   *  The LSB (Least Significant Bit)
   *  Pada bit pertama, simpan panjang data yang disembunyikan
   *  Dikali dengan 4 karena mengandung 1 kode karakter (8 bits)
   *  8 bits tersebut harus dibagi 2 dan setiap 2 bits harus digantikan
   */
  for (let i = 0; i < buffer.length; i++) {
    if (i == 0) {
      const bufferLength = buffer.length * 4;

      if (bufferLength > 255) {
        const division = bufferLength / 255;

        if (division % 1 === 0) {
          for (let j = 0; j < division; j++) {
            imageData.data[j] = 255;
            index++;
          }
        } else {
          const firstPortion = division.toString().split(".")[0];
          const secondPortion = division.toString().split(".")[1];
          let j = 0;

          for (j = 0; j < firstPortion; j++) {
            imageData.data[j] = 255;
            index++;
          }

          const numberLeft = Math.round((division - firstPortion) * 255);

          imageData.data[j] = numberLeft;
          index++;
        }
      } else {
        imageData.data[0] = bufferLength;
        index++;
      }
    }

    const asciiCode = buffer[i];
    
    /** 
     *  Menggunakan masking untuk menghilangkan bit yang tidak dibutuhkan dan ambil bit yang dibutuhkan saja
     *  0x03 = 3, 0x0c = 12, 0x30 = 48, 0xc0 = 192
     */
    // Ambil hanya 2 bit pertama, contoh 0111 0011 jadi 0000 0011
    const first2bit = asciiCode & 0x03;
    // Ambil hanya 4 bit pertama (2 bit diakhir), contoh 0111 0011 jadi 0000 0000
    const first4bitMiddle = (asciiCode & 0x0c) >> 2;
    // Ambil hanya 6 bit pertama (2 bit diakhir), contoh 0111 0011 jadi 0011 0000
    const first6bitMiddle = (asciiCode & 0x30) >> 4;
    // Ambil hanya 8 bit pertama (2 bit diakhir), contoh 0111 0011 jadi 0100 0000
    const first8bitMiddle = (asciiCode & 0xc0) >> 6;

    // Ganti bit pada gambar dengan bit pada pesan yang mau disembunyikan
    replaceByte(first2bit);
    replaceByte(first4bitMiddle);
    replaceByte(first6bitMiddle);
    replaceByte(first8bitMiddle);
  }
};

const replaceByte = (bits) => {
  imageData.data[index] = (imageData.data[index] & 0xfc) | bits;
  index++;
};
