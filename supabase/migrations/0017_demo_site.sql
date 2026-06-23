-- 0017_demo_site.sql
-- Crea il sito demo "Trattoria Demo Lumino" per /lumino-dashboard
-- Idempotente: non fa nulla se il sito esiste già

DO $$
DECLARE
  v_restaurant_id UUID;
  v_client_id     UUID;
  v_site_id       UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM sites WHERE slug = 'trattoria-demo-lumino') THEN
    RETURN;
  END IF;

  -- 1. Restaurant
  INSERT INTO restaurants (
    name, address, city, zone, category,
    phone, email, stars, reviews_count
  ) VALUES (
    'Trattoria Demo Lumino',
    'Via Brera 14',
    'Milano',
    'milano',
    'Trattoria',
    '+39 02 8765 4321',
    'info@trattoriademo.it',
    4.7,
    312
  )
  RETURNING id INTO v_restaurant_id;

  -- 2. Client
  INSERT INTO clients (
    restaurant_id, name, email, plan, status, price
  ) VALUES (
    v_restaurant_id,
    'Trattoria Demo Lumino',
    'demo@bylumino.com',
    'pro',
    'delivered',
    490
  )
  RETURNING id INTO v_client_id;

  -- 3. Site
  INSERT INTO sites (
    client_id, slug, tier, active, status, template_style
  ) VALUES (
    v_client_id,
    'trattoria-demo-lumino',
    'pro',
    true,
    'live',
    'modern'
  )
  RETURNING id INTO v_site_id;

  -- 4. Site content
  INSERT INTO site_content (
    site_id,
    restaurant_name, tagline, description,
    address, city, phone, email, whatsapp,
    opening_hours,
    feature_reservations_enabled,
    feature_newsletter_enabled,
    feature_events_enabled,
    feature_whatsapp_button_enabled,
    feature_reviews_enabled,
    feature_chef_section_enabled,
    chef_active,
    chef_name,
    chef_role,
    chef_quote
  ) VALUES (
    v_site_id,
    'Trattoria Demo Lumino',
    'La cucina italiana di casa, nel cuore di Brera',
    'Dal 1988, tre generazioni di passione per la cucina tradizionale milanese. Ingredienti freschi ogni mattina al mercato di Porta Genova, ricette di famiglia custodite con cura, un''atmosfera calda che ti fa sentire a casa. Non un ristorante — un''esperienza.',
    'Via Brera 14',
    'Milano',
    '+39 02 8765 4321',
    'info@trattoriademo.it',
    '390287654321',
    '{
      "mon": {"open": "12:00", "close": "22:30", "closed": true},
      "tue": {"open": "12:00", "close": "22:30", "closed": false},
      "wed": {"open": "12:00", "close": "22:30", "closed": false},
      "thu": {"open": "12:00", "close": "22:30", "closed": false},
      "fri": {"open": "12:00", "close": "23:00", "closed": false},
      "sat": {"open": "12:00", "close": "23:30", "closed": false},
      "sun": {"open": "12:00", "close": "16:00", "closed": false}
    }'::jsonb,
    true, true, true, true, true, true,
    true,
    'Marco Esposito',
    'Chef e proprietario',
    'Cucino per far sentire le persone a casa, anche quando sono lontane da casa.'
  );

  -- 5. Menu
  INSERT INTO site_menus (site_id, categories) VALUES (
    v_site_id,
    '[
      {
        "name": "Antipasti",
        "description": "Per iniziare con il piede giusto",
        "items": [
          {
            "name": "Burrata con pomodorini confit",
            "description": "Burrata pugliese, pomodorini confit al basilico, olio evo del Garda, sale Maldon",
            "price": 14,
            "allergens": ["vegetarian"]
          },
          {
            "name": "Prosciutto crudo di Parma e melone",
            "description": "24 mesi di stagionatura, melone retato di stagione, aceto balsamico tradizionale",
            "price": 16,
            "allergens": []
          }
        ]
      },
      {
        "name": "Primi",
        "description": "Il cuore della nostra cucina",
        "items": [
          {
            "name": "Risotto al tartufo nero",
            "description": "Riso Carnaroli della Lomellina, tartufo nero estivo di Norcia, parmigiano 36 mesi, burro di Normandia",
            "price": 24,
            "allergens": ["vegetarian", "signature"]
          },
          {
            "name": "Cacio e pepe tradizionale",
            "description": "Tonnarelli artigianali trafilati al bronzo, pecorino romano DOP, pepe nero di Sarawak",
            "price": 18,
            "allergens": ["vegetarian"]
          }
        ]
      },
      {
        "name": "Secondi",
        "description": "Carne e pesce selezionati ogni mattina",
        "items": [
          {
            "name": "Filetto di manzo al Barolo",
            "description": "Fassona piemontese, riduzione di Barolo 2019, purè di patate al burro, spinacino saltato",
            "price": 38,
            "allergens": []
          },
          {
            "name": "Branzino all''acqua pazza",
            "description": "Branzino del Mediterraneo, pomodorini del Vesuvio, capperi di Pantelleria, olive taggiasche",
            "price": 28,
            "allergens": []
          }
        ]
      },
      {
        "name": "Dolci",
        "description": "Il finale che merita",
        "items": [
          {
            "name": "Tiramisù della nonna",
            "description": "Ricetta originale di nonna Lucia: savoiardi, mascarpone DOP, espresso, cacao amaro 100%",
            "price": 9,
            "allergens": ["vegetarian", "signature"]
          }
        ]
      }
    ]'::jsonb
  );

  -- 6. Demo events
  INSERT INTO site_events (site_id, title, description, event_date, active) VALUES (
    v_site_id,
    'Cena degustazione con il sommelier',
    '5 portate abbinate a vini naturali selezionati. Il nostro sommelier guida la serata tra storia e profumi. Posti limitati a 20 persone.',
    (CURRENT_DATE + INTERVAL '10 days')::date,
    true
  );

  -- 7. Demo reservations
  INSERT INTO site_reservations (
    site_id, guest_name, guest_email, guest_phone,
    date, time, guests_count, notes, status
  ) VALUES
  (
    v_site_id,
    'Giulia Bianchi',
    'giulia.bianchi@email.it',
    '+39 347 876 5432',
    (CURRENT_DATE + INTERVAL '2 days')::date,
    '20:00',
    4,
    'Festeggiamo un compleanno — se possibile un tavolo in angolo.',
    'pending'
  ),
  (
    v_site_id,
    'Antonio Ferrara',
    'antonio.f@gmail.com',
    '+39 335 123 4567',
    (CURRENT_DATE + INTERVAL '5 days')::date,
    '19:30',
    2,
    null,
    'confirmed'
  );

END $$;
