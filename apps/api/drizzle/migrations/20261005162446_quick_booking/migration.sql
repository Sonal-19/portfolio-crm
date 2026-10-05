-- Floating "Book Kirtan" WhatsApp button. The existing settings row starts
-- enabled, with the current WhatsApp number as its first contact.
ALTER TABLE "site_settings" ADD COLUMN "quick_booking" jsonb DEFAULT '{"enabled":false,"channel":"whatsapp","label":"Book Kirtan","message":"Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏 I want to book a kirtan program.","mode":"choose","contacts":[]}' NOT NULL;--> statement-breakpoint
UPDATE "site_settings" SET "quick_booking" = jsonb_set(
	jsonb_set("quick_booking", '{enabled}', 'true'),
	'{contacts}',
	jsonb_build_array(jsonb_build_object(
		'id', 'office',
		'label', 'Amritvela Trust office',
		'number', regexp_replace("whatsapp_number", '\D', '', 'g'),
		'isActive', true
	))
) WHERE "whatsapp_number" <> '';
