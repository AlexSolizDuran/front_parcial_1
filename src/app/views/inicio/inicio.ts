import { Component } from '@angular/core';
import { Navbar } from '../../components/inicio/navbar/navbar';
import { Hero } from '../../components/inicio/hero/hero';
import { Features } from '../../components/inicio/features/features';
import { HowItWorks } from '../../components/inicio/how-it-works/how-it-works';
import { Cta } from '../../components/inicio/cta/cta';
import { Footer } from '../../components/inicio/footer/footer';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [Navbar, Hero, Features, HowItWorks, Cta, Footer],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {}
