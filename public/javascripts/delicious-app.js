import '../sass/style.scss';
import geoLocation from './modules/geoLocation';
import typeAhead from './modules/search'
import apiHeart from './modules/heart'

import { $, $$ } from './modules/bling';
 // Bling bros not jquery :D
geoLocation($('#address'),$('#lat'),$('#lng'));

// Search functionality
typeAhead($('.search'));

const heartForms = $$('form.heart');
heartForms.on('submit', apiHeart);
