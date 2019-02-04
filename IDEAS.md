# Gameplay

## Player

* player can control the light
    * light at player's head increases up to a certain level
    * when that level is reached the player can drop a fading particle and the light at their head dims

* depleted health bar = death
    * collision with monsters depletes health bar

## Items

* find or buy items to go along with play style

* coins to buy/unlock items/other stuff

* health items replenish health bar

* other items:
    * different player lights
    * unique lights with special properties (moving, showing directions)
    * keys to secret rooms

## Obstacles

* monsters
    * monsters in close proximity can be heard and every so often be seen (even behind walls)

* map
    * narrow tunnels
    * water (more further down)
    * rising/falling water

* light
    * darker further down

## Monster AI

* various 'idle' behaviour

* behaviour dependent on player form
    * hunt 'snake' player's tail rather than their head

* behaviour with limited amount of steps until monster stops for a while

* monsters attracted to light (further down?)
    * maybe attracted to different colors

* monster repelled by light (single levels?)

## Forms

* player can switch forms
    * by performing a transformation dance in close proximity to a shrine
    * initiating a dance will give a visual cue

* forms change the light particles
    * dot: white and dim
    * box: green and bright
    * snake: red and medium
    * fish: blue and dim

* 'fish' form restricted to water and movement similar to snake but more rigid

* form which only gradually changes directions

* form with independent but connected heads

* form with night vision

## Goal

* find exit

* go deeper

* collect points to unlock stuff

# Map Generation

* place objects in reasonable locations
    * mark reasonable locations on map

* generate tunnels between caverns
    * select caverns to be linked

* place switches in reasonable locations
    * mark reasonable locations on map

* place secret rooms and secret switches in reasonable locations
    * mark reasonable locations on map

* special maps on random levels
    * preceding levels tease this with sound and objects

# GUI

* show information
    * points
    * level
    * seed
    * form

* menu
    * seed input

# Graphics

* textures or dynamic colors

* pixel-shaders with light and shadows
    * everything without light is completely black (further down?)

* monster eyes glow (further down?)

* different water (/terrain) colors for different levels
