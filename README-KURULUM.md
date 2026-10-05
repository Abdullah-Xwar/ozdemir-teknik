# Özdemir Teknik Bilgisayar – Talep Sistemi Kurulum

## 1) Supabase
1. https://supabase.com adresinden proje oluştur.
2. **SQL Editor** bölümüne `schema.sql` dosyasını yapıştırıp çalıştır.
3. **Project Settings > API** bölümünden:
   - Project URL
   - anon / public key
   değerlerini al.
4. HTML içindeki:
   - `BURAYA_SUPABASE_PROJECT_URL`
   - `BURAYA_SUPABASE_ANON_PUBLIC_KEY`
   alanlarını doldur.
5. **Authentication > Users** bölümünden yönetici e-posta/şifre hesabını oluştur.

## 2) HTML
- `zdemir_teknik_bilgisayar_tam_kod.html` dosyasını Vercel'e yükle.
- Supabase URL ve anon key olmadan form çalışmaz.

## 3) WhatsApp Business otomatik bildirim
Tarayıcıdan doğrudan WhatsApp Business'a gizli API anahtarı koymak güvenli değildir. Bu nedenle Supabase Edge Function kullanılır.

1. Meta for Developers üzerinden WhatsApp Cloud API kur.
2. WhatsApp Business telefon numarası için `PHONE_NUMBER_ID` ve access token al.
3. WhatsApp Manager'da `new_service_request` isimli **UTILITY** mesaj şablonu oluştur. Body şu mantıkta olabilir:
   `Yeni servis talebi: {{1}} isimli müşteri {{2}} cihazıyla ilgili {{3}} sorununu bildirdi. Takip kodu: {{4}}`
4. Şablon onaylandıktan sonra Edge Function'a şu secret'ları tanımla:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_TO` → bildirimin gideceği WhatsApp numarası, ülke koduyla ve + olmadan.
   - `WEBHOOK_SECRET` → kendin belirlediğin uzun rastgele bir değer.
   - `META_GRAPH_VERSION` → Meta panelinde kullandığın güncel Graph API sürümü.
   - `WHATSAPP_TEMPLATE_NAME` → `new_service_request`
   - `WHATSAPP_TEMPLATE_LANGUAGE` → `tr`

## 4) Supabase Database Webhook
Database > Webhooks bölümünde `service_requests` tablosu için **INSERT** webhook oluştur ve Edge Function'ı hedef olarak seç.
Header ekle:
`x-webhook-secret: SENIN_WEBHOOK_SECRET_DEGERIN`

Webhook sayesinde siteye biri talep gönderdiğinde akış:

`Form → Supabase service_requests → Database Webhook → Edge Function → WhatsApp Business`

## 5) Kullanım
- Ziyaretçi talep oluşturur: anında veritabanına kaydolur.
- Her ziyaretçi açık talep listesini görür.
- Sen `#admin` bölümünden yönetici hesabınla girersin.
- Durum, yapılacak işlem, servis notu ve teslim tarihini değiştirip **Kaydet** dersin.
- Herkes sayfayı yenilediğinde güncel bilgiyi görür.
- Realtime aktifse sayfa açıkken yeni kayıtlar da otomatik yenilenir.

### Güvenlik
HTML'de sadece Supabase `anon/public` anahtarı bulunabilir. **service_role key veya WhatsApp access token kesinlikle HTML'ye yazılmamalıdır.**

### Önemli gizlilik notu
Sen özellikle herkesin talepleri görebilmesini istediğin için sistemde talepler public SELECT ile okunuyor. Bu nedenle müşterilerin telefon numarası public listede gösterilmiyor; yalnızca yetkili yönetim ekranında tutuluyor.
