# Eltera HH Salary API

Netlify serverless function for getting a median salary benchmark from HeadHunter vacancies.

Endpoint after deploy:

```text
https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/hh-salary
```

Request:

```json
{
  "vacancyName": "грузчик",
  "region": "Москва"
}
```

Response:

```json
{
  "averageSalary": 65000,
  "source": "hh.ru",
  "region": "Москва",
  "vacancyName": "грузчик",
  "vacanciesUsed": 28
}
```
