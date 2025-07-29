#!/usr/bin/env ruby
# encoding: utf-8

# Sistema de Ragdoll Inteligente em Ruby
# Implementação das funcionalidades avançadas de IA e comportamentos

require 'json'
require 'securerandom'

class Vector2D
  attr_accessor :x, :y

  def initialize(x = 0, y = 0)
    @x = x.to_f
    @y = y.to_f
  end

  def +(other)
    Vector2D.new(@x + other.x, @y + other.y)
  end

  def -(other)
    Vector2D.new(@x - other.x, @y - other.y)
  end

  def *(scalar)
    Vector2D.new(@x * scalar, @y * scalar)
  end

  def magnitude
    Math.sqrt(@x * @x + @y * @y)
  end

  def normalize
    mag = magnitude
    return Vector2D.new(0, 0) if mag == 0
    Vector2D.new(@x / mag, @y / mag)
  end

  def distance_to(other)
    Math.sqrt((@x - other.x) ** 2 + (@y - other.y) ** 2)
  end

  def to_s
    "(#{@x.round(2)}, #{@y.round(2)})"
  end
end

class RagdollAI
  attr_accessor :fear, :energy, :health, :personality, :last_jump, :injured, :target, :state, :color

  STATES = %w[idle fleeing fighting injured parkour cooperating curious dead].freeze

  def initialize
    @fear = 0.0
    @energy = 100.0
    @health = 100.0
    @personality = rand # 0 = covarde, 1 = corajoso
    @last_jump = 0
    @injured = false
    @target = nil
    @state = 'idle'
    @color = generate_random_color
  end

  def update_emotion
    # Recuperação gradual
    @fear = [@fear - 0.1, 0].max
    @energy = [@energy + 0.2, 100].min
    @health = [@health + 0.1, 100].min if @injured

    # Remover estado de ferimento se curado
    if @injured && @health > 80
      @injured = false
      puts "🩹 Ragdoll curado! Saúde: #{@health.round(1)}"
    end

    # Resetar estado se não há ação específica
    if @state != 'dead' && @fear < 10 && @energy > 50
      @state = 'idle'
    end
  end

  def take_damage(force)
    damage = [force * 2, 20].min
    @health -= damage
    @fear += damage

    if @health < 50
      @injured = true
      @state = 'injured'
      puts "💥 Ragdoll ferido! Saúde: #{@health.round(1)}, Medo: #{@fear.round(1)}"
    end

    if @health <= 0
      @state = 'dead'
      puts "💀 Ragdoll morreu!"
    end
  end

  def can_jump?
    Time.now.to_f - @last_jump > 1.0 && @energy > 20
  end

  def perform_jump
    @last_jump = Time.now.to_f
    @energy -= 20
    @state = 'parkour'
    puts "🤸‍♂️ Ragdoll fazendo parkour! Energia: #{@energy.round(1)}"
  end

  def compatibility_with(other_ai)
    (@personality - other_ai.personality).abs
  end

  def describe_state
    case @state
    when 'idle'
      "😐 Relaxado (Energia: #{@energy.round(1)})"
    when 'fleeing'
      "😱 Fugindo do mouse! (Medo: #{@fear.round(1)})"
    when 'fighting'
      "🥊 Brigando! (Energia: #{@energy.round(1)})"
    when 'injured'
      "🤕 Ferido (Saúde: #{@health.round(1)})"
    when 'parkour'
      "🤸‍♂️ Fazendo parkour!"
    when 'cooperating'
      "🤝 Cooperando com outro ragdoll"
    when 'curious'
      "🤔 Curioso sobre outro ragdoll"
    when 'dead'
      "💀 Morto"
    else
      "❓ Estado desconhecido"
    end
  end

  private

  def generate_random_color
    colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']
    colors.sample
  end
end

class Ragdoll
  attr_accessor :id, :position, :velocity, :ai, :body_parts

  def initialize(x = 0, y = 0)
    @id = SecureRandom.uuid
    @position = Vector2D.new(x, y)
    @velocity = Vector2D.new(0, 0)
    @ai = RagdollAI.new
    @body_parts = create_body_parts
    puts "🎭 Novo ragdoll criado em #{@position} com personalidade #{(@ai.personality * 100).round}%"
  end

  def update(mouse_position, other_ragdolls, obstacles)
    return if @ai.state == 'dead'

    @ai.update_emotion
    
    # Comportamento baseado na proximidade do mouse
    mouse_distance = @position.distance_to(mouse_position)
    flee_from_mouse(mouse_position) if mouse_distance < 200

    # Parkour inteligente
    perform_parkour(obstacles) if obstacles.any? && @ai.can_jump?

    # Interações com outros ragdolls
    interact_with_others(other_ragdolls)

    # Aplicar comportamentos baseados no estado
    apply_behavior

    # Atualizar posição
    update_physics
  end

  def flee_from_mouse(mouse_position)
    flee_direction = (@position - mouse_position).normalize
    mouse_distance = @position.distance_to(mouse_position)
    
    # Força de fuga baseada na personalidade
    flee_force = (1 - @ai.personality) * 0.5 + 0.2
    panic_multiplier = mouse_distance < 100 ? 2 : 1
    
    force = flee_direction * flee_force * panic_multiplier
    apply_force(force)
    
    @ai.fear = [@ai.fear + 2, 100].min
    @ai.state = 'fleeing'
    
    puts "🏃‍♂️ Ragdoll #{@id[0..7]} fugindo! Distância do mouse: #{mouse_distance.round(1)}"
  end

  def perform_parkour(obstacles)
    nearby_obstacles = obstacles.select { |obs| @position.distance_to(obs) < 80 }
    
    if nearby_obstacles.any?
      @ai.perform_jump
      
      # Aplicar força de pulo
      jump_force = 0.8 + (@ai.personality * 0.4)
      apply_force(Vector2D.new(0, -jump_force))
      
      # Força horizontal para superar obstáculo
      obstacle = nearby_obstacles.first
      direction = @position.x < obstacle.x ? 1 : -1
      apply_force(Vector2D.new(direction * 0.3, 0))
    end
  end

  def interact_with_others(other_ragdolls)
    other_ragdolls.each do |other|
      next if other.id == @id || other.ai.state == 'dead'
      
      distance = @position.distance_to(other.position)
      next unless distance < 100
      
      compatibility = @ai.compatibility_with(other.ai)
      
      if compatibility < 0.3
        cooperate_with(other)
      elsif compatibility > 0.7
        fight_with(other)
      else
        be_curious_about(other)
      end
    end
  end

  def cooperate_with(other)
    # Ragdolls se ajudam mutuamente
    direction = (other.position - @position).normalize * 0.1
    apply_force(direction)
    other.apply_force(direction * -1)
    
    @ai.state = 'cooperating'
    other.ai.state = 'cooperating'
    
    # Cura mútua se feridos
    if @ai.injured
      @ai.health = [@ai.health + 0.5, 100].min
    end
    if other.ai.injured
      other.ai.health = [other.ai.health + 0.5, 100].min
    end
    
    puts "🤝 Ragdolls #{@id[0..7]} e #{other.id[0..7]} cooperando!"
  end

  def fight_with(other)
    # Ragdolls brigam
    force_direction = (other.position - @position).normalize * 0.3
    apply_force(force_direction)
    other.apply_force(force_direction * -1)
    
    @ai.state = 'fighting'
    other.ai.state = 'fighting'
    @ai.energy -= 1
    other.ai.energy -= 1
    
    puts "🥊 Ragdolls #{@id[0..7]} e #{other.id[0..7]} brigando!"
  end

  def be_curious_about(other)
    # Ragdolls se observam com curiosidade
    @ai.state = 'curious'
    other.ai.state = 'curious'
    
    # Movimento sutil de aproximação
    direction = (other.position - @position).normalize * 0.05
    apply_force(direction)
    other.apply_force(direction * -1)
    
    puts "🤔 Ragdolls #{@id[0..7]} e #{other.id[0..7]} curiosos um sobre o outro"
  end

  def apply_behavior
    case @ai.state
    when 'injured'
      # Movimento mais lento e errático
      if rand < 0.1
        random_force = Vector2D.new((rand - 0.5) * 0.1, 0)
        apply_force(random_force)
      end
    when 'idle'
      # Movimento aleatório ocasional
      if rand < 0.02
        random_force = Vector2D.new((rand - 0.5) * 0.2, 0)
        apply_force(random_force)
      end
    end
  end

  def apply_force(force)
    @velocity = @velocity + force
  end

  def update_physics
    # Aplicar fricção
    @velocity = @velocity * 0.98
    
    # Atualizar posição
    @position = @position + @velocity
    
    # Limites da tela (assumindo 800x600)
    @position.x = [[0, @position.x].max, 800].min
    @position.y = [[0, @position.y].max, 600].min
  end

  def handle_collision(impact_force)
    @ai.take_damage(impact_force)
  end

  def to_json
    {
      id: @id,
      position: { x: @position.x, y: @position.y },
      velocity: { x: @velocity.x, y: @velocity.y },
      ai: {
        state: @ai.state,
        health: @ai.health,
        energy: @ai.energy,
        fear: @ai.fear,
        personality: @ai.personality,
        injured: @ai.injured,
        color: @ai.color
      }
    }
  end

  def status_report
    puts "🎭 Ragdoll #{@id[0..7]}:"
    puts "   📍 Posição: #{@position}"
    puts "   🏃 Velocidade: #{@velocity}"
    puts "   🧠 Estado: #{@ai.describe_state}"
    puts "   💪 Personalidade: #{(@ai.personality * 100).round}% corajoso"
    puts
  end

  private

  def create_body_parts
    {
      head: { radius: 15, color: @ai.color },
      torso: { width: 20, height: 40, color: '#4a90e2' },
      left_arm: { width: 8, height: 25, color: '#5a9bd4' },
      right_arm: { width: 8, height: 25, color: '#5a9bd4' },
      left_leg: { width: 10, height: 30, color: '#3a7bc8' },
      right_leg: { width: 10, height: 30, color: '#3a7bc8' }
    }
  end
end

class PhysicsWorld
  attr_accessor :ragdolls, :mouse_position, :obstacles

  def initialize
    @ragdolls = []
    @mouse_position = Vector2D.new(400, 300)
    @obstacles = []
    @running = false
    puts "🌍 Mundo físico inicializado!"
  end

  def add_ragdoll(x = nil, y = nil)
    x ||= rand(700) + 50
    y ||= rand(500) + 50
    ragdoll = Ragdoll.new(x, y)
    @ragdolls << ragdoll
    puts "✅ Ragdoll adicionado! Total: #{@ragdolls.length}"
    ragdoll
  end

  def add_obstacle(x, y)
    @obstacles << Vector2D.new(x, y)
    puts "🧱 Obstáculo adicionado em (#{x}, #{y})"
  end

  def update_mouse_position(x, y)
    @mouse_position = Vector2D.new(x, y)
  end

  def simulate_step
    return if @ragdolls.empty?

    @ragdolls.each do |ragdoll|
      ragdoll.update(@mouse_position, @ragdolls, @obstacles)
    end

    # Simular colisões
    simulate_collisions
  end

  def simulate_collisions
    @ragdolls.each do |ragdoll|
      # Colisão com paredes
      if ragdoll.position.x <= 0 || ragdoll.position.x >= 800 ||
         ragdoll.position.y <= 0 || ragdoll.position.y >= 600
        impact_force = ragdoll.velocity.magnitude
        ragdoll.handle_collision(impact_force) if impact_force > 5
      end

      # Colisões entre ragdolls
      @ragdolls.each do |other|
        next if ragdoll.id == other.id
        
        distance = ragdoll.position.distance_to(other.position)
        if distance < 30 # Colisão detectada
          impact_force = (ragdoll.velocity.magnitude + other.velocity.magnitude) / 2
          if impact_force > 3
            ragdoll.handle_collision(impact_force * 0.5)
            other.handle_collision(impact_force * 0.5)
          end
        end
      end
    end
  end

  def start_simulation
    @running = true
    puts "🚀 Simulação iniciada!"
    
    Thread.new do
      while @running
        simulate_step
        sleep(1.0 / 60) # 60 FPS
      end
    end
  end

  def stop_simulation
    @running = false
    puts "⏹️ Simulação parada!"
  end

  def status_report
    puts "\n" + "=" * 50
    puts "🌍 RELATÓRIO DO MUNDO FÍSICO"
    puts "=" * 50
    puts "🎭 Ragdolls ativos: #{@ragdolls.count { |r| r.ai.state != 'dead' }}/#{@ragdolls.length}"
    puts "🖱️ Posição do mouse: #{@mouse_position}"
    puts "🧱 Obstáculos: #{@obstacles.length}"
    puts
    
    @ragdolls.each(&:status_report)
    
    # Estatísticas dos estados
    states = @ragdolls.group_by { |r| r.ai.state }
    puts "📊 ESTATÍSTICAS DOS ESTADOS:"
    states.each do |state, ragdolls|
      puts "   #{state}: #{ragdolls.length} ragdolls"
    end
    puts "=" * 50 + "\n"
  end

  def export_state
    {
      timestamp: Time.now.to_f,
      mouse_position: { x: @mouse_position.x, y: @mouse_position.y },
      ragdolls: @ragdolls.map(&:to_json),
      obstacles: @obstacles.map { |obs| { x: obs.x, y: obs.y } }
    }
  end
end

# Exemplo de uso e demonstração
if __FILE__ == $0
  puts "🎮 SIMULADOR DE RAGDOLLS INTELIGENTES EM RUBY"
  puts "=" * 50
  
  # Criar mundo
  world = PhysicsWorld.new
  
  # Adicionar alguns ragdolls
  3.times { world.add_ragdoll }
  
  # Adicionar obstáculos
  world.add_obstacle(400, 500)
  world.add_obstacle(200, 300)
  
  # Simular movimento do mouse
  puts "\n🖱️ Simulando movimento do mouse..."
  mouse_positions = [
    [100, 100], [200, 150], [300, 200], [400, 250], [500, 300],
    [600, 350], [700, 400], [600, 450], [500, 400], [400, 350]
  ]
  
  mouse_positions.each_with_index do |(x, y), i|
    puts "\n⏱️ Frame #{i + 1}/#{mouse_positions.length}"
    world.update_mouse_position(x, y)
    world.simulate_step
    
    # Relatório a cada 3 frames
    world.status_report if (i + 1) % 3 == 0
    
    sleep(0.5) # Pausa para visualização
  end
  
  puts "\n🎯 Simulação concluída!"
  world.status_report
  
  # Exportar estado final
  final_state = world.export_state
  puts "\n💾 Estado final exportado:"
  puts JSON.pretty_generate(final_state)
end