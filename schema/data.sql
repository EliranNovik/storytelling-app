--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (2, 'alice_writer', 'alice@example.com', '$2a$10$6KqMR.5rJpS0RrE1jSs9K.H4AoLO0eZ9d3L6ZMgZ4.qhqJYKZ3mKe', '2025-05-08 23:51:10.260324', '2025-05-08 23:51:10.260324', NULL);
INSERT INTO public.users VALUES (3, 'bob_storyteller', 'bob@example.com', '$2a$10$6KqMR.5rJpS0RrE1jSs9K.H4AoLO0eZ9d3L6ZMgZ4.qhqJYKZ3mKe', '2025-05-08 23:51:10.260324', '2025-05-08 23:51:10.260324', NULL);
INSERT INTO public.users VALUES (4, 'carol_tales', 'carol@example.com', '$2a$10$6KqMR.5rJpS0RrE1jSs9K.H4AoLO0eZ9d3L6ZMgZ4.qhqJYKZ3mKe', '2025-05-08 23:51:10.260324', '2025-05-08 23:51:10.260324', NULL);
INSERT INTO public.users VALUES (5, 'marina', 'marina@gmail.com', '$2a$10$ulLg/jfmNfixOdM0D6bL3uhXwx6PgcWBWUOjebHTGYoGCbc0eB7UK', '2025-05-09 00:30:45.812848', '2025-05-09 00:30:45.812848', NULL);
INSERT INTO public.users VALUES (6, 'testuser', 'testuser@gmail.com', '$2a$10$fxJM2RrrElCuB.26g1zCVOR7zfCT5n0yoNaOasUg9IyEuKpBvE9oW', '2025-05-11 10:27:28.931197', '2025-05-11 10:27:28.931197', NULL);
INSERT INTO public.users VALUES (1, 'eno123', 'eno@hotmail.com', '$2a$10$9rh0a.I6.1F5wl65L4Wk5OIBhE8YhEbFjEHrqa7Yga6hV0yrkAV0K', '2025-05-08 23:20:18.909918', '2025-05-11 12:08:17.629037', NULL);


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.stories VALUES (8, 'Alice and the Clockmaker', 'Alice always wondered why the old clock in her attic ticked backwards. One night, she discovered a hidden compartment with a letter from a mysterious clockmaker...
kkk
i', 2, '2025-05-11 09:18:21.753268', '2025-05-11 11:44:53.814669', '2025-05-11 11:44:53.814669', 1);
INSERT INTO public.stories VALUES (11, 'Marina and the Star Map', 'Marina inherited a dusty map from her grandmother. When she followed its path, she found herself under a sky filled with unfamiliar constellations... ', 5, '2025-05-11 09:18:21.753268', '2025-05-11 10:17:12.062866', '2025-05-11 10:17:12.062866', 4);
INSERT INTO public.stories VALUES (10, 'Carol’s Secret Garden', 'Carol tended her garden every morning, but no one knew about the magical creatures that lived among her flowers. Until one day, a neighbor saw a fairy... desiree

fff', 4, '2025-05-11 09:18:21.753268', '2025-05-11 10:09:29.476811', '2025-05-11 10:09:29.476811', 4);
INSERT INTO public.stories VALUES (9, 'The Last Storyteller', 'In a world where stories were forbidden, one man risked everything to keep the art of storytelling alive. His words sparked a revolution... test
test 
lkk
ffefe



', 3, '2025-05-11 09:18:21.753268', '2025-05-11 10:26:33.420796', '2025-05-11 10:26:33.420796', 1);
INSERT INTO public.stories VALUES (7, 'The Lost City', 'Deep in the Amazon, explorers found ruins of a city that was thought to be a myth. As they ventured further, they realized the city was not abandoned... test test

test kjjjj', 1, '2025-05-11 09:18:21.753268', '2025-05-11 10:28:47.726278', '2025-05-11 10:28:47.726278', 6);


--
-- Data for Name: story_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: block_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: block_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.comments VALUES (4, 'nice', 8, 4, '2025-05-11 10:02:03.934882+03');
INSERT INTO public.comments VALUES (5, 'wow
', 9, 4, '2025-05-11 10:02:17.667025+03');
INSERT INTO public.comments VALUES (6, 'kkkk', 10, 1, '2025-05-11 10:23:28.800768+03');


--
-- Data for Name: contributors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 6, true);


--
-- Name: contributors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contributors_id_seq', 1, false);


--
-- Name: stories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stories_id_seq', 11, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--

