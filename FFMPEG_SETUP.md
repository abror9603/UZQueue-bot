# FFmpeg O'rnatish Qo'llanmasi

## ✅ Paket O'rnatildi

`fluent-ffmpeg` paketi o'rnatildi:
```bash
npm install fluent-ffmpeg
```

## 🔧 FFmpeg Binary O'rnatish

### Windows

1. **FFmpeg yuklab olish:**
   - https://www.gyan.dev/ffmpeg/builds/
   - Yoki: https://ffmpeg.org/download.html
   - "ffmpeg-release-essentials.zip" ni yuklab oling

2. **O'rnatish:**
   - Zip faylni oching
   - `ffmpeg.exe` bo'lgan papkani toping (odatda `bin` papkasi)
   - Masalan: `C:\ffmpeg\bin\ffmpeg.exe`

3. **PATH ga qo'shish:**
   - Windows Settings → System → About → Advanced system settings
   - Environment Variables
   - System variables → Path → Edit
   - New → `C:\ffmpeg\bin` qo'shing
   - OK

4. **Tekshirish:**
   ```cmd
   ffmpeg -version
   ```
   Versiya chiqishi kerak.

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg
```

### macOS

```bash
brew install ffmpeg
```

### Docker

Dockerfile ga qo'shildi:
```dockerfile
RUN apk add --no-cache ffmpeg
```

## 🎯 Kod Ishlashi

Kod endi shunday ishlaydi:

1. **Agar FFmpeg o'rnatilgan bo'lsa:**
   - OGG → MP3 konvertatsiya qilinadi
   - Yaxshiroq audio sifat

2. **Agar FFmpeg yo'q bo'lsa:**
   - Original OGG format ishlatiladi
   - Whisper API OGG ni qo'llab-quvvatlaydi
   - Xatolik bermaydi

## ✅ Tekshirish

Botni ishga tushiring va ovozli xabar yuboring. Agar FFmpeg o'rnatilgan bo'lsa, konvertatsiya qilinadi, aks holda original format ishlatiladi.

## 📝 Eslatma

FFmpeg ixtiyoriy - agar o'rnatilmagan bo'lsa ham bot ishlaydi. Faqat MP3 konvertatsiya qilinmaydi, lekin Whisper API OGG ni ham qo'llab-quvvatlaydi.

