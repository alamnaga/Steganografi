const image2 = document.getElementById("image2");
const imagePreview2 = document.getElementById("imagepreview2");

const imageMessages = document.getElementById("imagemessages");
const contextImageMessage = imageMessages.getContext("2d");

image2.addEventListener("change", (e) => {
  const img = e.target.files[0];
  const fr = new FileReader();

  fr.addEventListener("load", (e) => {
    if (e.target.readyState == FileReader.DONE) {
      imagePreview2.src = e.target.result;
    }
  });

  fr.addEventListener("loadend", (e) => {
    const tmpImg = new Image();

    tmpImg.src = e.target.result;

    tmpImg.onload = () => {
      contextImageMessage.drawImage(tmpImg, 0, 0);
      
      const imageData2 = contextImageMessage.getImageData(
        0,
        0,
        imageMessages.height,
        imageMessages.width
      );
      let totalLength = 0;
      let lastIndex;
      
      /**
       *  Perulangan untuk semua bit pada pixel
       *  Menjumlahkan panjangnya data yang di sembunyikan
       */
      for (let i = 0; i < imageData2.data.length; i++) {
        if (imageData2.data[i] == 255) {
          totalLength += imageData2.data[i];

          if (imageData2.data[i + 1] < 255) {
            totalLength += imageData2.data[i + 1];
            lastIndex = i + 1;
            break;
          }
        } else {
          totalLength += imageData2.data[i];
          lastIndex = i;
          break;
        }
      }
      
      // Dibagi 4 karena 1 karakter sama dengan 8 bit
      const fileBuffer2 = new Uint8Array(totalLength / 4);
      let j = 0;

      /**
       *  Perulangan untuk mengekstrak bits dari pixel
       *  Dimulai dari 2 diawal karena hanya butuh 2 bit dari setiap byte yang ada
       *  2 bit tersebut terdapat pesan yang disembunyikan
       *  Langkah pertama menghilangkan bit yang tidak berguna menggunakan mask(3) == 0000 0011
       *  Kemudian, geser kekiri disetiap bit (Pengurutan)
       */
      for (let i = lastIndex + 1; i < totalLength; i = i + 4) {
        const aShift = imageData2.data[i] & 3;
        const bShift = (imageData2.data[i + 1] & 3) << 2;
        const cShift = (imageData2.data[i + 2] & 3) << 4;
        const dShift = (imageData2.data[i + 3] & 3) << 6;

        // Gabungkan semua bit yang sudah digeser untuk membentuk satu byte (8 bits)
        const result = aShift | bShift | cShift | dShift;

        // Simpan hasil (1 byte) ke dalam unsigned integer
        fileBuffer2[j] = result;
        j++;
      }
      
      // Men Decode kumpulan unsigned integer kedalam ASCII karakter
      const result = decodeUtf8(fileBuffer2);
      
      // Mendownload file otomatis
      saveByteArray(result.split(""), "TheMessages.txt");
    };
  });

  fr.readAsDataURL(img);
});

/**
 *  http://ciaranj.blogspot.my/2007/11/utf8-characters-encoding-in-javascript.html
 */
const decodeUtf8 = (buffer) => {
  let result = "";
  let i = 0;
  let c = 0;
  let c2 = 0;

  const data = new Uint8Array(buffer);

  if (
    data.length >= 3 &&
    data[0] === 0xef &&
    data[1] === 0xbb &&
    data[2] === 0xbf
  ) {
    i = 3;
  }

  while (i < data.length) {
    c = data[i];

    if (c < 128) {
      result += String.fromCharCode(c);
      i++;
    } else if (c > 191 && c < 224) {
      if (i + 1 >= data.length) {
        throw "UTF-8 Decode failed. Two byte character was truncated.";
      }
      c2 = data[i + 1];
      result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
      i += 2;
    } else {
      if (i + 2 >= data.length) {
        throw "UTF-8 Decode failed. Multi byte character was truncated.";
      }
      c2 = data[i + 1];
      c3 = data[i + 2];
      result += String.fromCharCode(
        ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
      );
      i += 3;
    }
  }

  return result;
}

/**
 *  http://stackoverflow.com/users/1086928/syntax
 */
const saveByteArray = (data, filename) => {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";

  const blob = new Blob(data, {
    type: "octet/stream",
  }),
  url = window.URL.createObjectURL(blob);

  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
