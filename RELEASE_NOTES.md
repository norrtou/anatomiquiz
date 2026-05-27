# RELEASE NOTES

Använd den här filen för att skapa formella release-notiser när ni taggar en version.

Mall för en release:

## [vX.Y.Z] - yyyy-mm-dd
### Added
- Kort punktlista över ny funktionalitet.

### Changed
- Punktlista över ändringar som kan påverka användning.

### Fixed
- Buggar som lösts.

### Migration
- Eventuella migreringssteg (t.ex. localStorage-nycklar) som användare eller driftsättningsteam måste genomföra.

Senaste release:

## [v0.3.0] - 2026-05-27
### Changed
- App döpt om till "Anatomiquiz" för att reflektera bredare anatomiinriktning.
- Meta description och tagline uppdaterade för att beskriva allmän anatomiquiz.
- Projektomfattning expanderad för att inkludera alla anatomiämnen.

Tidigare exempel (0.2.0):

## [v0.2.0] - 2026-05-27
### Added
- App namn ändrat till "Hur är läget?".
- Visuell märkning av platshållarfrågor i hanteringsvyn.

### Changed
- UI-texter standardiserade (t.ex. "Highscores" → "Topplista").
- Platshållarfrågor utesluts från quizval tills de ersätts.
- localStorage-nycklar migrerades från `wiil_...` till `hur_...`.

### Migration
- Vid första körning migreras befintliga localStorage-nycklar automatiskt; gamla nycklar raderas.


