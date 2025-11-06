# Instrukcja Obsługi TomSoft PM

## Spis treści

1. [Pierwsze kroki](#pierwsze-kroki)
2. [Logowanie i rejestracja](#logowanie-i-rejestracja)
3. [Dashboard](#dashboard)
4. [Zarządzanie projektami](#zarządzanie-projektami)
5. [Zarządzanie zadaniami](#zarządzanie-zadaniami)
6. [Zarządzanie zespołem](#zarządzanie-zespołem)
7. [Powiadomienia](#powiadomienia)
8. [Ustawienia](#ustawienia)
9. [Często zadawane pytania](#często-zadawane-pytania)

## Pierwsze kroki

### Dostęp do aplikacji
1. Otwórz przeglądarkę internetową
2. Przejdź na adres: `http://localhost:3002` (development) lub adres produkcyjny
3. Zobaczysz stronę główną TomSoft PM

### Konta testowe
Po instalacji dostępne są następujące konta testowe:

| Rola | Email | Hasło | Opis |
|------|-------|-------|------|
| Admin | admin@tomsoft.pl | password123 | Pełne uprawnienia |
| Project Manager | pm@tomsoft.pl | password123 | Zarządzanie projektami |
| Developer | dev@tomsoft.pl | password123 | Praca nad zadaniami |
| Developer | maria@tomsoft.pl | password123 | Drugi developer |
| Client | client@example.com | password123 | Klient zewnętrzny |

## Logowanie i rejestracja

### Logowanie
1. Kliknij przycisk **"Zaloguj się"** na stronie głównej
2. Wprowadź swój **email** i **hasło**
3. Kliknij **"Zaloguj się"**
4. Zostaniesz przekierowany do dashboardu

### Rejestracja nowego konta
1. Kliknij przycisk **"Zarejestruj się"** na stronie głównej
2. Wypełnij formularz:
   - **Email**: Twój adres email
   - **Hasło**: Minimum 8 znaków
   - **Imię**: Twoje imię
   - **Nazwisko**: Twoje nazwisko
   - **Nazwa użytkownika**: Unikalna nazwa
3. Kliknij **"Zarejestruj się"**
4. Zostaniesz przekierowany do strony logowania

### Dwuskładnikowa autentykacja (2FA)
1. Po zalogowaniu przejdź do **Ustawień**
2. Kliknij **"Bezpieczeństwo"**
3. Włącz **"Dwuskładnikowa autentykacja"**
4. Zeskanuj kod QR aplikacją authenticator (Google Authenticator, Authy)
5. Wprowadź kod z aplikacji aby potwierdzić

## Dashboard

Dashboard to główna strona aplikacji po zalogowaniu.

### Elementy dashboardu:
- **Powitanie**: Personalizowane powitanie z imieniem
- **Statystyki**: Kluczowe metryki projektów
- **Ostatnie projekty**: Lista 5 najnowszych projektów
- **Szybkie akcje**: Przyciski do tworzenia nowych elementów

### Statystyki:
1. **Aktywne projekty**: Liczba projektów w trakcie
2. **Członkowie zespołu**: Liczba aktywnych użytkowników
3. **Ukończone zadania**: Zadania zakończone w tym miesiącu
4. **Ogólny postęp**: Średni postęp wszystkich projektów

## Zarządzanie projektami

### Tworzenie nowego projektu
1. Kliknij **"Nowy projekt"** na dashboardzie lub w menu **Projekty**
2. Wypełnij formularz:
   - **Nazwa**: Nazwa projektu
   - **Opis**: Szczegółowy opis
   - **Data rozpoczęcia**: Kiedy projekt się zaczyna
   - **Deadline**: Termin zakończenia
   - **Budżet**: Planowany budżet (opcjonalnie)
   - **Status**: Planowany/Aktywny/Wstrzymany/Zakończony
3. Kliknij **"Utwórz projekt"**

### Edycja projektu
1. Przejdź do listy **Projektów**
2. Kliknij na projekt, który chcesz edytować
3. Kliknij przycisk **"Edytuj"**
4. Wprowadź zmiany i kliknij **"Zapisz"**

### Przypisywanie zespołu
1. Otwórz szczegóły projektu
2. Przejdź do zakładki **"Zespół"**
3. Kliknij **"Dodaj członka"**
4. Wybierz użytkownika z listy
5. Wybierz rolę w projekcie
6. Kliknij **"Dodaj"**

### Statusy projektów:
- **Planowany**: Projekt w fazie planowania
- **Aktywny**: Projekt w trakcie realizacji
- **Wstrzymany**: Projekt tymczasowo zatrzymany
- **Zakończony**: Projekt ukończony

## Zarządzanie zadaniami

### Tablica Kanban
Głównym narzędziem do zarządzania zadaniami jest tablica Kanban z kolumnami:

1. **Do zrobienia**: Nowe zadania
2. **W trakcie**: Zadania w realizacji
3. **Do sprawdzenia**: Zadania oczekujące na review
4. **Zakończone**: Ukończone zadania

### Tworzenie zadania
1. Przejdź do **Zadań** lub otwórz projekt
2. Kliknij **"Nowe zadanie"**
3. Wypełnij formularz:
   - **Tytuł**: Krótki opis zadania
   - **Opis**: Szczegółowy opis
   - **Projekt**: Wybierz projekt
   - **Przypisane do**: Wybierz wykonawcę
   - **Priorytet**: Niski/Średni/Wysoki/Krytyczny
   - **Deadline**: Termin wykonania
   - **Szacowany czas**: Ile godzin zajmie
4. Kliknij **"Utwórz zadanie"**

### Przenoszenie zadań
1. Na tablicy Kanban **przeciągnij i upuść** zadanie do odpowiedniej kolumny
2. Status zadania zostanie automatycznie zaktualizowany
3. Wszyscy członkowie zespołu zobaczą zmianę w czasie rzeczywistym

### Priorytety zadań:
- 🔴 **Krytyczny**: Wymaga natychmiastowej uwagi
- 🟠 **Wysoki**: Ważne zadanie
- 🟡 **Średni**: Standardowy priorytet
- 🟢 **Niski**: Można zrobić później

### Komentarze do zadań
1. Otwórz szczegóły zadania
2. Przewiń do sekcji **"Komentarze"**
3. Napisz komentarz w polu tekstowym
4. Kliknij **"Dodaj komentarz"**
5. Komentarz będzie widoczny dla wszystkich członków projektu

### Załączniki
1. W szczegółach zadania kliknij **"Dodaj załącznik"**
2. Wybierz plik z dysku (max 10MB)
3. Plik zostanie przesłany i będzie dostępny dla zespołu

## Zarządzanie zespołem

### Dodawanie nowego użytkownika
**Tylko administratorzy mogą dodawać użytkowników**

1. Przejdź do **Zespół** w menu
2. Kliknij **"Dodaj użytkownika"**
3. Wypełnij formularz:
   - **Email**: Adres email nowego użytkownika
   - **Imię i nazwisko**: Dane osobowe
   - **Rola**: Admin/Project Manager/Developer/Client
   - **Hasło tymczasowe**: Zostanie wysłane emailem
4. Kliknij **"Dodaj użytkownika"**

### Role systemowe:

#### 🔴 Administrator
- Pełne uprawnienia do systemu
- Zarządzanie użytkownikami
- Konfiguracja systemu
- Dostęp do wszystkich projektów

#### 🟠 Project Manager
- Tworzenie i zarządzanie projektami
- Przypisywanie zadań
- Zarządzanie zespołami projektów
- Generowanie raportów

#### 🟡 Developer
- Praca nad przypisanymi zadaniami
- Komentowanie i aktualizacja statusów
- Śledzenie czasu pracy
- Dostęp do projektów, w których uczestniczy

#### 🟢 Client
- Podgląd postępu projektów
- Komentowanie zadań
- Dostęp tylko do własnych projektów

### Edycja profilu
1. Kliknij na swój avatar w prawym górnym rogu
2. Wybierz **"Profil"**
3. Edytuj swoje dane:
   - Imię i nazwisko
   - Email
   - Avatar (prześlij zdjęcie)
   - Hasło (w zakładce Bezpieczeństwo)
4. Kliknij **"Zapisz zmiany"**

## Powiadomienia

### Typy powiadomień:
- 📧 **Email**: Ważne wydarzenia wysyłane na email
- 🔔 **Push**: Powiadomienia w przeglądarce
- 💬 **W aplikacji**: Powiadomienia w centrum powiadomień

### Centrum powiadomień
1. Kliknij ikonę dzwonka w górnym menu
2. Zobacz listę najnowszych powiadomień
3. Kliknij powiadomienie aby przejść do szczegółów
4. Kliknij **"Oznacz wszystkie jako przeczytane"**

### Konfiguracja powiadomień
1. Przejdź do **Ustawień**
2. Kliknij **"Powiadomienia"**
3. Skonfiguruj preferencje:
   - Nowe zadania
   - Zmiany statusu
   - Komentarze
   - Deadline'y
   - Powiadomienia email
4. Kliknij **"Zapisz ustawienia"**

## Ustawienia

### Ustawienia konta
- **Profil**: Edycja danych osobowych
- **Bezpieczeństwo**: Zmiana hasła, 2FA
- **Powiadomienia**: Preferencje powiadomień
- **Prywatność**: Ustawienia prywatności

### Ustawienia systemu (tylko Admin)
- **Użytkownicy**: Zarządzanie kontami
- **Projekty**: Globalne ustawienia projektów
- **Integracje**: Konfiguracja zewnętrznych usług
- **Backup**: Kopie zapasowe danych

## Często zadawane pytania

### Q: Jak zresetować hasło?
A: Na stronie logowania kliknij "Zapomniałeś hasła?" i postępuj zgodnie z instrukcjami.

### Q: Czy mogę pracować offline?
A: Tak, aplikacja obsługuje podstawowe funkcje offline dzięki technologii PWA.

### Q: Jak dodać aplikację do telefonu?
A: W przeglądarce mobilnej kliknij "Dodaj do ekranu głównego" gdy pojawi się prompt.

### Q: Czy dane są bezpieczne?
A: Tak, używamy szyfrowania, bezpiecznych haseł i regularnych kopii zapasowych.

### Q: Jak eksportować dane?
A: W ustawieniach znajdziesz opcję "Eksport danych" do pobrania swoich informacji.

---

**Potrzebujesz pomocy?**
Skontaktuj się z autorem: tomasz.chromy@outlook.com

**Copyright © 2024 Tomasz Chromy. Wszelkie prawa zastrzeżone.**
