# Gameplay

## Player

* player can control the light
    * directly (intensity)
    * indirectly (torches)

## Obstacles

* monsters

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

* monster repelled by light (single levels?)

## Forms

* player can switch forms
    * via fixed switches with infinite uses
    * via portable switches with finite uses

* 'fish' form restricted to water and movement similar to snake but more rigid

* form which only gradually changes directions

## Goal

* find exit

* go deeper

* collect points

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
