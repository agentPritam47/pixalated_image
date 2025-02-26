import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

export class Content {
	// DOM elements
	DOM = {
		el: null,
		canvasWrap: null,
		canvas: null,
		inner: null
	};
	// the image source/url
	imageSrc;
	// canvas image
	img;
	// the image ratio
	imgRatio;
	// canvas context
	ctx;
	// The pixelation factor values determine the level of 
	// pixelation at each step of the effect.
	// Starting with larger values for more visible pixelation
	// that gradually reduces to show the clear image
	pxFactorValues = [.02, 0.04, 0.06, 0.09, 1.0];
	pxIndex = 0;

	/**
	 * Constructor for the Content class.
	 * Accepts a DOM element representing the content element.
	 */
	constructor(DOM_el) {
		// Initialize DOM elements
		this.DOM.el = DOM_el;
		
		// Get image source from src attribute instead of background style
		this.imageSrc = this.DOM.el.src;

		// Create a canvas element
		this.DOM.canvas = document.createElement('canvas');
		
		// Hide original image
		this.DOM.el.style.display = 'none';
		
		// Insert canvas after the image
		this.DOM.el.parentNode.insertBefore(this.DOM.canvas, this.DOM.el.nextSibling);
		
		// Store reference to parent container
		this.DOM.canvasWrap = this.DOM.el.parentNode;

		// Get the 2D rendering context of the canvas
		this.ctx = this.DOM.canvas.getContext('2d');

		// Create a new Image object and load the image source
		this.img = new Image();
		this.img.src = this.imageSrc;

		// Once the image is loaded, perform necessary calculations and rendering
		this.img.onload = () => {
			const imgWidth = this.img.width;
			const imgHeight = this.img.height;
			this.imgRatio = imgWidth / imgHeight;
			this.setCanvasSize();
			this.render();
			// Set up event listeners and triggers
			this.initEvents();
		};
	}

	/**
	 * Sets up event listeners and the GSAP scroll triggers.
	 * Handles resize events and triggers the pixelation 
	 * effect when the image enters the viewport.
	 */
	initEvents() {
		// Register ScrollTrigger plugin
		gsap.registerPlugin(ScrollTrigger);

		// Resize event handler with debounce
		let resizeTimeout;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				this.setCanvasSize();
				this.pxIndex = this.pxFactorValues.length - 1; // Reset to clear image
				this.render();
			}, 100);
		});

		// Trigger pixelation effect when reaching the 
		// specific starting point:
		ScrollTrigger.create({
			trigger: this.DOM.canvas,
			start: 'top top',
			onEnter: () => {
				this.pxIndex = 0;
				this.animatePixels();
			},
			once: true
		});

		// Add parallax effect to titles
		if (this.DOM.inner) {
			gsap.timeline({
				scrollTrigger: {
					trigger: this.DOM.canvas,
					start: 'top bottom',
					end: 'bottom top',
					scrub: true
				}
			})
			.to(this.DOM.inner, {
				ease: 'none',
				yPercent: -100
			});
		}

		// show canvasWrap when the element enters the viewport
		ScrollTrigger.create({
			trigger: this.DOM.canvas,
			start: 'top bottom',
			onEnter: () => {
				gsap.set(this.DOM.canvasWrap, {
					opacity: 1
				})
			},
			once: true
		});
	}

	/**
	 * Sets the canvas size based on the dimensions 
	 * of the canvasWrap element.
	 */
	setCanvasSize() {
		this.DOM.canvas.width = this.DOM.canvasWrap.offsetWidth;
		this.DOM.canvas.height = this.DOM.canvasWrap.offsetHeight;
		this.DOM.canvas.style.width = '100%';
		this.DOM.canvas.style.height = '100%';
	}

	/**
	 * Renders the image on the canvas.
	 * Applies the pixelation effect based on the pixel factor.
	 */
	render() {
		const w = this.DOM.canvas.width;
		const h = this.DOM.canvas.height;

		// Calculate the dimensions and position for rendering the image 
		let newWidth = w;
		let newHeight = h;
		let newX = 0;
		let newY = 0;

		if (newWidth / newHeight > this.imgRatio) {
			newHeight = Math.round(w / this.imgRatio);
		} else {
			newWidth = Math.round(h * this.imgRatio);
			newX = (w - newWidth) / 2;
		}

		// Get the current scale factor
		const scale = this.pxFactorValues[this.pxIndex];
		
		// Calculate the scaled dimensions
		const scaledW = Math.floor(w * scale);
		const scaledH = Math.floor(h * scale);

		// Clear the canvas
		this.ctx.clearRect(0, 0, w, h);

		// Disable image smoothing for pixelation effect
		this.ctx.imageSmoothingEnabled = false;

		// Draw the image at a smaller size
		this.ctx.drawImage(this.img, 0, 0, scaledW, scaledH);

		// Scale it back up with pixelation
		this.ctx.drawImage(
			this.DOM.canvas,
			0, 0, scaledW, scaledH,
			newX, newY, newWidth, newHeight
		);
	}

	/**
	 * Animates the pixelation effect.
	 * Renders the image with increasing pixelation factor at each step.
	 */
	animatePixels() {
		if (this.pxIndex < this.pxFactorValues.length) {
			this.render();
			setTimeout(() => {
				this.pxIndex++;
				this.animatePixels();
			}, 100);
		}
	}
}